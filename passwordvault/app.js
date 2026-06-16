/**
 * 密码保险箱 - 主应用
 */

const App = {
    // 状态
    config: null,          // 配置信息
    vaultData: null,       // 保险库数据
    masterKey: null,       // 主密钥（内存中）
    remoteData: null,       // 远程数据（用于同步）
    currentGroup: 'all',   // 当前选中的分组
    searchQuery: '',       // 搜索关键词
    selectMode: false,     // 多选模式
    selectedAccounts: [],  // 选中的账号
    syncInfo: null,        // 同步信息
    totpInterval: null,    // 时序密码定时器
    shareData: null,       // 分享数据

    // localStorage keys
    STORAGE_KEYS: {
        CONFIG: 'pwsafe_config',
        DATA_VERSION: 'pwsafe_data_version',
        LAST_SYNC: 'pwsafe_last_sync'
    },

    // Emoji 列表
    EMOJIS: ['📁', '🏠', '💼', '💳', '🎮', '📱', '💻', '🌐', '🎯', '⭐', '📧', '🔐', '💰', '📸', '🎵', '📚', '🎥', '🛒', '✈️', '🍔'],

    /**
     * 初始化应用
     */
    async init() {
        // 检查配置
        const configStr = localStorage.getItem(this.STORAGE_KEYS.CONFIG);
        
        if (!configStr) {
            // 首次使用，进入设置页
            this.showScreen('setup-screen');
        } else {
            // 有配置，进入锁屏页
            this.config = JSON.parse(configStr);
            this.showScreen('lock-screen');
            document.getElementById('unlock-password').focus();
        }

        // 绑定表单事件
        this.bindEvents();
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 解锁表单
        document.getElementById('unlock-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUnlock();
        });

        // 设置表单
        document.getElementById('setup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSetup();
        });

        // 账号表单
        document.getElementById('account-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAccount();
        });

        // 分组表单
        document.getElementById('group-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGroup();
        });

        // 初始化 Emoji 选择器
        this.initEmojiPicker();

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    },

    /**
     * 显示屏幕
     */
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    },

    /**
     * 处理首次设置
     */
    async handleSetup() {
        const token = document.getElementById('setup-token').value.trim();
        const repo = document.getElementById('setup-repo').value.trim();
        const masterKey = document.getElementById('setup-master-key').value;
        const masterKeyConfirm = document.getElementById('setup-master-key-confirm').value;
        const errorEl = document.getElementById('setup-error');

        // 验证
        if (!token) {
            errorEl.textContent = '请输入 Gitee 令牌';
            errorEl.classList.remove('hidden');
            return;
        }

        if (!repo) {
            errorEl.textContent = '请输入仓库地址';
            errorEl.classList.remove('hidden');
            return;
        }

        if (masterKey.length < 8) {
            errorEl.textContent = '主密钥至少需要 8 位';
            errorEl.classList.remove('hidden');
            return;
        }

        if (masterKey !== masterKeyConfirm) {
            errorEl.textContent = '两次输入的主密钥不一致';
            errorEl.classList.remove('hidden');
            return;
        }

        // 验证 Gitee 配置
        try {
            this.showToast('正在验证 Gitee 配置...');
            const tokenValid = await GiteeAPI.verifyToken(token);
            if (!tokenValid.valid) {
                throw new Error('Gitee 令牌无效');
            }

            const repoValid = await GiteeAPI.verifyRepoAccess(token, repo);
            if (!repoValid.valid) {
                throw new Error(repoValid.message);
            }
        } catch (error) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
            return;
        }

        // 保存配置
        const masterKeyHash = await CryptoModule.hashMasterKey(masterKey);
        this.config = {
            gitee_token: token,
            repo_url: repo,
            master_key_hash: masterKeyHash,
            salt: CryptoModule.arrayBufferToBase64(CryptoModule.generateSalt())
        };

        localStorage.setItem(this.STORAGE_KEYS.CONFIG, JSON.stringify(this.config));

        // 解锁并进入主界面
        this.masterKey = masterKey;
        this.vaultData = this.getEmptyVaultData();
        await this.saveLocalData();
        
        this.showToast('配置完成');
        this.showMainScreen();
    },

    /**
     * 处理解锁
     */
    async handleUnlock() {
        const password = document.getElementById('unlock-password').value;
        const errorEl = document.getElementById('unlock-error');

        if (!password) {
            errorEl.textContent = '请输入主密钥';
            errorEl.classList.remove('hidden');
            return;
        }

        // 快速验证
        const isValid = await CryptoModule.verifyMasterKey(password, this.config.master_key_hash);
        if (!isValid) {
            errorEl.textContent = '主密钥错误';
            errorEl.classList.remove('hidden');
            document.getElementById('unlock-password').value = '';
            return;
        }

        // 加载本地数据
        this.masterKey = password;
        await this.loadLocalData();

        // 清除输入
        document.getElementById('unlock-password').value = '';

        this.showMainScreen();
    },

    /**
     * 显示主界面
     */
    showMainScreen() {
        this.showScreen('main-screen');
        this.renderGroups();
        this.renderAccounts();
        this.updateSyncStatus();
    },

    /**
     * 获取空的数据结构
     */
    getEmptyVaultData() {
        return {
            version: 1,
            groups: [
                { id: 'default', name: '默认分组', icon: '📁', order: 0, createdAt: new Date().toISOString() }
            ],
            accounts: [],
            lastModified: new Date().toISOString()
        };
    },

    /**
     * 保存本地数据
     */
    async saveLocalData() {
        const encrypted = await CryptoModule.encryptData(this.masterKey, JSON.stringify(this.vaultData));
        localStorage.setItem('pwsafe_vault', JSON.stringify(encrypted));
        localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    },

    /**
     * 加载本地数据
     */
    async loadLocalData() {
        const encryptedStr = localStorage.getItem('pwsafe_vault');
        
        if (!encryptedStr) {
            this.vaultData = this.getEmptyVaultData();
            return;
        }

        try {
            const encrypted = JSON.parse(encryptedStr);
            const decrypted = await CryptoModule.decryptData(this.masterKey, encrypted);
            this.vaultData = JSON.parse(decrypted);
        } catch (error) {
            this.showToast('数据加载失败，请检查主密钥');
            throw error;
        }
    },

    // ============ 分组管理 ============

    /**
     * 初始化 Emoji 选择器
     */
    initEmojiPicker() {
        const picker = document.getElementById('emoji-picker');
        if (!picker) return;

        picker.innerHTML = this.EMOJIS.map(emoji => 
            `<span class="emoji-option" onclick="App.selectEmoji('${emoji}')">${emoji}</span>`
        ).join('');
    },

    /**
     * 选择 Emoji
     */
    selectEmoji(emoji) {
        document.getElementById('group-icon').value = emoji;
    },

    /**
     * 渲染分组列表
     */
    renderGroups() {
        const container = document.getElementById('groups-list');
        const groups = this.vaultData.groups;
        
        // 计算每组账号数量
        const countByGroup = {};
        this.vaultData.accounts.forEach(acc => {
            countByGroup[acc.groupId] = (countByGroup[acc.groupId] || 0) + 1;
        });

        let html = `
            <div class="group-item all ${this.currentGroup === 'all' ? 'active' : ''}" onclick="App.filterByGroup('all')">
                <span class="group-icon">📋</span>
                <span class="group-name">全部</span>
                <span class="group-count">(${this.vaultData.accounts.length})</span>
            </div>
        `;

        groups.forEach(group => {
            const count = countByGroup[group.id] || 0;
            html += `
                <div class="group-item ${this.currentGroup === group.id ? 'active' : ''}" onclick="App.filterByGroup('${group.id}')">
                    <span class="group-icon">${group.icon}</span>
                    <span class="group-name">${group.name}</span>
                    <span class="group-count">(${count})</span>
                    <button class="icon-btn delete-btn" onclick="event.stopPropagation(); App.deleteGroup('${group.id}')" title="删除">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * 按分组筛选
     */
    filterByGroup(groupId) {
        this.currentGroup = groupId;
        this.renderGroups();
        this.renderAccounts();
    },

    /**
     * 显示分组弹窗
     */
    showGroupModal(groupId = null) {
        const modal = document.getElementById('group-modal');
        const title = document.getElementById('group-modal-title');

        if (groupId) {
            const group = this.vaultData.groups.find(g => g.id === groupId);
            if (group) {
                title.textContent = '编辑分组';
                document.getElementById('group-id').value = group.id;
                document.getElementById('group-name').value = group.name;
                document.getElementById('group-icon').value = group.icon;
            }
        } else {
            title.textContent = '新增分组';
            document.getElementById('group-id').value = '';
            document.getElementById('group-name').value = '';
            document.getElementById('group-icon').value = '';
        }

        modal.classList.remove('hidden');
    },

    /**
     * 关闭分组弹窗
     */
    closeGroupModal() {
        document.getElementById('group-modal').classList.add('hidden');
        document.getElementById('group-form').reset();
    },

    /**
     * 保存分组
     */
    saveGroup() {
        const id = document.getElementById('group-id').value;
        const name = document.getElementById('group-name').value.trim();
        const icon = document.getElementById('group-icon').value || '📁';

        if (!name) {
            this.showToast('请输入分组名称');
            return;
        }

        if (id) {
            // 编辑
            const group = this.vaultData.groups.find(g => g.id === id);
            if (group) {
                group.name = name;
                group.icon = icon;
            }
        } else {
            // 新增
            this.vaultData.groups.push({
                id: CryptoModule.generateUUID(),
                name,
                icon,
                order: this.vaultData.groups.length,
                createdAt: new Date().toISOString()
            });
        }

        this.saveLocalData();
        this.closeGroupModal();
        this.renderGroups();
        this.showToast(id ? '分组已更新' : '分组已创建');
    },

    /**
     * 删除分组
     */
    deleteGroup(groupId) {
        if (groupId === 'default') {
            this.showToast('默认分组不能删除');
            return;
        }

        if (!confirm('删除分组后，其中的账号将移至默认分组，确定删除？')) {
            return;
        }

        // 将该分组的账号移到默认分组
        this.vaultData.accounts.forEach(acc => {
            if (acc.groupId === groupId) {
                acc.groupId = 'default';
            }
        });

        // 删除分组
        this.vaultData.groups = this.vaultData.groups.filter(g => g.id !== groupId);

        this.saveLocalData();
        this.renderGroups();
        this.renderAccounts();
        this.showToast('分组已删除');
    },

    // ============ 账号管理 ============

    /**
     * 渲染账号列表
     */
    renderAccounts() {
        const container = document.getElementById('accounts-list');
        const countEl = document.getElementById('accounts-count');

        let accounts = this.vaultData.accounts;

        // 筛选分组
        if (this.currentGroup !== 'all') {
            accounts = accounts.filter(a => a.groupId === this.currentGroup);
        }

        // 筛选搜索
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            accounts = accounts.filter(a => 
                a.title.toLowerCase().includes(query) ||
                a.username.toLowerCase().includes(query) ||
                (a.url && a.url.toLowerCase().includes(query))
            );
        }

        countEl.textContent = `(${accounts.length})`;

        if (accounts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔐</div>
                    <p>${this.searchQuery ? '没有找到匹配的账号' : '还没有账号，点击 + 添加'}</p>
                </div>
            `;
            return;
        }

        const html = accounts.map(account => {
            const group = this.vaultData.groups.find(g => g.id === account.groupId);
            const isSelected = this.selectedAccounts.includes(account.id);

            return `
                <div class="account-card ${isSelected ? 'selected' : ''}" onclick="App.toggleAccountSelect('${account.id}', event)">
                    <div class="account-card-header">
                        <div class="account-card-title">
                            ${account.title}
                            ${group ? `<span class="group-tag">${group.icon} ${group.name}</span>` : ''}
                        </div>
                        <div class="account-card-actions">
                            <button class="icon-btn" onclick="event.stopPropagation(); App.copyToClipboard('${account.username}')" title="复制账号">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                            <button class="icon-btn" onclick="event.stopPropagation(); App.copyPassword('${account.id}')" title="复制密码">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </button>
                            <button class="icon-btn" onclick="event.stopPropagation(); App.showAccountModal('${account.id}')" title="编辑">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="icon-btn" onclick="event.stopPropagation(); App.deleteAccount('${account.id}')" title="删除">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="account-card-body">
                        <div class="account-field">
                            <span class="account-field-label">账号</span>
                            <span class="account-field-value">${account.username}</span>
                        </div>
                        <div class="account-field">
                            <span class="account-field-label">密码</span>
                            <span class="account-field-value">••••••••</span>
                        </div>
                        ${account.url ? `
                            <div class="account-field">
                                <span class="account-field-label">网址</span>
                                <span class="account-field-value">${account.url}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        // 处理多选模式样式
        if (this.selectMode) {
            container.classList.add('select-mode');
        } else {
            container.classList.remove('select-mode');
        }
    },

    /**
     * 搜索账号
     */
    searchAccounts(query) {
        this.searchQuery = query;
        this.renderAccounts();
    },

    /**
     * 切换账号选中状态
     */
    toggleAccountSelect(accountId, event) {
        if (!this.selectMode) {
            // 非多选模式，单击查看详情
            return;
        }

        const index = this.selectedAccounts.indexOf(accountId);
        if (index === -1) {
            this.selectedAccounts.push(accountId);
        } else {
            this.selectedAccounts.splice(index, 1);
        }

        this.renderAccounts();
        document.getElementById('selected-count').textContent = this.selectedAccounts.length;
    },

    /**
     * 切换多选模式
     */
    toggleSelectMode() {
        this.selectMode = !this.selectMode;
        if (!this.selectMode) {
            this.selectedAccounts = [];
        }
        this.renderAccounts();
    },

    /**
     * 显示账号弹窗
     */
    showAccountModal(accountId = null) {
        const modal = document.getElementById('account-modal');
        const title = document.getElementById('account-modal-title');
        const groupSelect = document.getElementById('account-group');

        // 填充分组选项
        groupSelect.innerHTML = this.vaultData.groups.map(g => 
            `<option value="${g.id}">${g.icon} ${g.name}</option>`
        ).join('');

        if (accountId) {
            const account = this.vaultData.accounts.find(a => a.id === accountId);
            if (account) {
                title.textContent = '编辑账号';
                document.getElementById('account-id').value = account.id;
                document.getElementById('account-group').value = account.groupId;
                document.getElementById('account-title').value = account.title;
                document.getElementById('account-username').value = account.username;
                document.getElementById('account-password').value = account.password;
                document.getElementById('account-url').value = account.url || '';
                document.getElementById('account-notes').value = account.notes || '';
            }
        } else {
            title.textContent = '新增账号';
            document.getElementById('account-id').value = '';
            document.getElementById('account-group').value = this.currentGroup === 'all' ? 'default' : this.currentGroup;
            document.getElementById('account-title').value = '';
            document.getElementById('account-username').value = '';
            document.getElementById('account-password').value = '';
            document.getElementById('account-url').value = '';
            document.getElementById('account-notes').value = '';
        }

        modal.classList.remove('hidden');
    },

    /**
     * 关闭账号弹窗
     */
    closeAccountModal() {
        document.getElementById('account-modal').classList.add('hidden');
        document.getElementById('account-form').reset();
    },

    /**
     * 保存账号
     */
    saveAccount() {
        const id = document.getElementById('account-id').value;
        const groupId = document.getElementById('account-group').value;
        const title = document.getElementById('account-title').value.trim();
        const username = document.getElementById('account-username').value.trim();
        const password = document.getElementById('account-password').value;
        const url = document.getElementById('account-url').value.trim();
        const notes = document.getElementById('account-notes').value.trim();

        if (!title || !username || !password) {
            this.showToast('请填写必填项');
            return;
        }

        if (id) {
            // 编辑
            const account = this.vaultData.accounts.find(a => a.id === id);
            if (account) {
                account.groupId = groupId;
                account.title = title;
                account.username = username;
                account.password = password;
                account.url = url || null;
                account.notes = notes || null;
                account.updatedAt = new Date().toISOString();
            }
        } else {
            // 新增
            this.vaultData.accounts.push({
                id: CryptoModule.generateUUID(),
                groupId,
                title,
                username,
                password,
                url: url || null,
                notes: notes || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        this.vaultData.lastModified = new Date().toISOString();
        this.saveLocalData();
        this.closeAccountModal();
        this.renderGroups();
        this.renderAccounts();
        this.showToast(id ? '账号已更新' : '账号已创建');
    },

    /**
     * 删除账号
     */
    deleteAccount(accountId) {
        if (!confirm('确定删除这个账号？')) {
            return;
        }

        this.vaultData.accounts = this.vaultData.accounts.filter(a => a.id !== accountId);
        this.vaultData.lastModified = new Date().toISOString();
        this.saveLocalData();
        this.renderGroups();
        this.renderAccounts();
        this.showToast('账号已删除');
    },

    /**
     * 生成密码
     */
    generatePassword() {
        const password = CryptoModule.generatePassword(16);
        document.getElementById('account-password').value = password;
        this.showToast('密码已生成');
    },

    /**
     * 生成主密钥
     */
    generateMasterKey() {
        const key = CryptoModule.generatePassword(16);
        document.getElementById('setup-master-key').value = key;
        document.getElementById('setup-master-key-confirm').value = key;
        this.showToast('密钥已生成');
    },

    // ============ 工具方法 ============

    /**
     * 切换密码可见性
     */
    togglePasswordVisibility(inputId, btn) {
        const input = document.getElementById(inputId);
        if (input.type === 'password') {
            input.type = 'text';
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
            `;
        } else {
            input.type = 'password';
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            `;
        }
    },

    /**
     * 复制到剪贴板
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('已复制到剪贴板');
        } catch (error) {
            this.showToast('复制失败');
        }
    },

    /**
     * 复制密码（需要解密）
     */
    async copyPassword(accountId) {
        const account = this.vaultData.accounts.find(a => a.id === accountId);
        if (account) {
            await this.copyToClipboard(account.password);
        }
    },

    /**
     * 关闭所有弹窗
     */
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        this.stopTotpTimer();
    },

    /**
     * 显示 Toast
     */
    showToast(message, duration = 2000) {
        const toast = document.getElementById('toast');
        const messageEl = document.getElementById('toast-message');
        messageEl.textContent = message;
        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, duration);
    },

    /**
     * 锁定应用
     */
    lock() {
        this.masterKey = null;
        this.vaultData = null;
        this.closeAllModals();
        this.showScreen('lock-screen');
        document.getElementById('unlock-password').focus();
        this.showToast('已锁定');
    },

    /**
     * 清除所有数据
     */
    clearAllData() {
        if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) {
            return;
        }

        localStorage.removeItem(this.STORAGE_KEYS.CONFIG);
        localStorage.removeItem('pwsafe_vault');
        localStorage.removeItem(this.STORAGE_KEYS.LAST_SYNC);

        this.config = null;
        this.vaultData = null;
        this.masterKey = null;

        this.closeAllModals();
        this.showScreen('setup-screen');
        this.showToast('所有数据已清除');
    },

    // ============ 设置相关 ============

    /**
     * 显示设置
     */
    showSettings() {
        const modal = document.getElementById('settings-modal');
        document.getElementById('settings-token').value = this.config.gitee_token || '';
        document.getElementById('settings-repo').value = this.config.repo_url || '';
        modal.classList.remove('hidden');
    },

    /**
     * 关闭设置
     */
    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    },

    /**
     * 保存 Gitee 配置
     */
    async saveGiteeConfig() {
        const token = document.getElementById('settings-token').value.trim();
        const repo = document.getElementById('settings-repo').value.trim();

        if (!token || !repo) {
            this.showToast('请填写完整信息');
            return;
        }

        try {
            const tokenValid = await GiteeAPI.verifyToken(token);
            if (!tokenValid.valid) {
                throw new Error('Gitee 令牌无效');
            }

            const repoValid = await GiteeAPI.verifyRepoAccess(token, repo);
            if (!repoValid.valid) {
                throw new Error(repoValid.message);
            }

            this.config.gitee_token = token;
            this.config.repo_url = repo;
            localStorage.setItem(this.STORAGE_KEYS.CONFIG, JSON.stringify(this.config));

            this.closeSettings();
            this.showToast('配置已保存');
        } catch (error) {
            this.showToast(error.message);
        }
    },

    /**
     * 更新同步状态显示
     */
    updateSyncStatus() {
        const badge = document.getElementById('sync-badge');
        const time = document.getElementById('sync-time');

        if (!this.syncInfo) {
            badge.textContent = '未同步';
            badge.className = 'sync-badge';
            time.textContent = '-';
            return;
        }

        badge.textContent = this.syncInfo.synced ? '已同步' : '待推送';
        badge.className = `sync-badge ${this.syncInfo.synced ? 'synced' : 'pending'}`;
        time.textContent = this.syncInfo.time || '-';
    },

    // ============ 同步功能 ============

    /**
     * 同步数据（从远程拉取并对比）
     */
    async syncData() {
        if (!this.config.gitee_token || !this.config.repo_url) {
            this.showToast('请先配置 Gitee');
            this.showSettings();
            return;
        }

        try {
            this.showToast('正在同步...');
            this.toggleSyncIcon(true);

            // 拉取远程数据
            const remote = await GiteeAPI.pullRemote(this.config.gitee_token, this.config.repo_url);

            if (!remote) {
                // 远程没有数据，询问是否推送
                this.showToast('远程暂无数据，是否推送到云端？');
                this.syncInfo = {
                    synced: false,
                    hasRemote: false,
                    remote: null,
                    sha: null,
                    time: new Date().toLocaleString()
                };
                this.updateSyncStatus();
                return;
            }

            // 解密远程数据
            const decryptedRemote = await CryptoModule.decryptData(this.masterKey, remote.data);
            const remoteVaultData = JSON.parse(decryptedRemote);

            // 对比数据
            const diff = this.compareData(this.vaultData, remoteVaultData);

            if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
                this.showToast('数据已是最新');
                this.syncInfo = {
                    synced: true,
                    hasRemote: true,
                    remote: remoteVaultData,
                    sha: remote.sha,
                    time: new Date().toLocaleString()
                };
                this.updateSyncStatus();
                return;
            }

            // 显示差异面板
            this.showSyncModal(diff, remote.sha, remoteVaultData);

        } catch (error) {
            console.error('同步失败:', error);
            this.showToast('同步失败: ' + error.message);
        } finally {
            this.toggleSyncIcon(false);
        }
    },

    /**
     * 对比本地和远程数据
     */
    compareData(local, remote) {
        const result = {
            added: [],    // 远程有，本地无
            removed: [],  // 本地有，远程无
            changed: [],  // 两边都有但时间不同
            localNewer: false,
            remoteNewer: false
        };

        const localMap = new Map(local.accounts.map(a => [a.id, a]));
        const remoteMap = new Map(remote.accounts.map(a => [a.id, a]));

        // 检查远程新增
        for (const [id, account] of remoteMap) {
            if (!localMap.has(id)) {
                result.added.push(account);
            }
        }

        // 检查本地新增和变更
        for (const [id, account] of localMap) {
            if (!remoteMap.has(id)) {
                result.removed.push(account);
            } else {
                const remoteAccount = remoteMap.get(id);
                if (new Date(account.updatedAt) > new Date(remoteAccount.updatedAt)) {
                    result.changed.push({ type: 'local', account });
                    result.localNewer = true;
                } else if (new Date(account.updatedAt) < new Date(remoteAccount.updatedAt)) {
                    result.changed.push({ type: 'remote', account: remoteAccount });
                    result.remoteNewer = true;
                }
            }
        }

        return result;
    },

    /**
     * 显示同步弹窗
     */
    showSyncModal(diff = null, sha = null, remoteData = null) {
        const modal = document.getElementById('sync-modal');
        const diffContainer = document.getElementById('sync-diff');

        if (!diff) {
            // 初始化，显示选项
            diffContainer.innerHTML = `
                <div class="sync-action-btn" onclick="App.syncFromRemote()">
                    <strong>从云端拉取</strong>
                    <p style="color: var(--text-muted); margin-top: 4px;">下载远程数据到本地</p>
                </div>
                <div class="sync-action-btn" onclick="App.pushToRemote()">
                    <strong>推送到云端</strong>
                    <p style="color: var(--text-muted); margin-top: 4px;">上传本地数据到云端</p>
                </div>
            `;
            document.getElementById('sync-actions').classList.add('hidden');
        } else {
            // 显示差异
            let html = '';

            if (diff.added.length > 0) {
                html += `<p style="color: var(--success); margin-bottom: 8px;">+ 远程新增 ${diff.added.length} 条</p>`;
                diff.added.forEach(acc => {
                    html += `
                        <div class="diff-item">
                            <div class="diff-icon add">+</div>
                            <div class="diff-text">
                                <div class="title">${acc.title}</div>
                                <div class="desc">将在本地新增</div>
                            </div>
                        </div>
                    `;
                });
            }

            if (diff.removed.length > 0) {
                html += `<p style="color: var(--danger); margin-bottom: 8px; margin-top: 12px;">- 本地将删除 ${diff.removed.length} 条</p>`;
                diff.removed.forEach(acc => {
                    html += `
                        <div class="diff-item">
                            <div class="diff-icon remove">-</div>
                            <div class="diff-text">
                                <div class="title">${acc.title}</div>
                                <div class="desc">将从本地删除</div>
                            </div>
                        </div>
                    `;
                });
            }

            if (diff.changed.length > 0) {
                html += `<p style="color: var(--warning); margin-bottom: 8px; margin-top: 12px;">~ 冲突 ${diff.changed.length} 条</p>`;
                diff.changed.forEach(item => {
                    const source = item.type === 'local' ? '本地更新' : '远程更新';
                    html += `
                        <div class="diff-item">
                            <div class="diff-icon change">~</div>
                            <div class="diff-text">
                                <div class="title">${item.account.title}</div>
                                <div class="desc">${source} (${new Date(item.account.updatedAt).toLocaleString()})</div>
                            </div>
                        </div>
                    `;
                });
            }

            diffContainer.innerHTML = html || '<p style="text-align: center; color: var(--text-muted);">数据完全一致</p>';

            // 存储差异信息供确认时使用
            this._syncDiff = diff;
            this._syncSha = sha;
            this._remoteData = remoteData;
        }

        modal.classList.remove('hidden');
    },

    /**
     * 关闭同步弹窗
     */
    closeSyncModal() {
        document.getElementById('sync-modal').classList.add('hidden');
        this._syncDiff = null;
        this._syncSha = null;
        this._remoteData = null;
    },

    /**
     * 从远程拉取
     */
    async syncFromRemote() {
        try {
            const remote = await GiteeAPI.pullRemote(this.config.gitee_token, this.config.repo_url);
            if (!remote) {
                this.showToast('远程暂无数据');
                return;
            }

            const decryptedRemote = await CryptoModule.decryptData(this.masterKey, remote.data);
            this.vaultData = JSON.parse(decryptedRemote);

            await this.saveLocalData();
            this.renderGroups();
            this.renderAccounts();

            this.syncInfo = {
                synced: true,
                hasRemote: true,
                remote: this.vaultData,
                sha: remote.sha,
                time: new Date().toLocaleString()
            };
            this.updateSyncStatus();

            this.closeSyncModal();
            this.showToast('同步成功');
        } catch (error) {
            this.showToast('同步失败: ' + error.message);
        }
    },

    /**
     * 执行同步确认
     */
    async executeSync() {
        const diff = this._syncDiff;
        const remoteData = this._remoteData;

        if (!diff) {
            this.closeSyncModal();
            return;
        }

        try {
            // 合并数据策略：以更新的数据为准
            const localMap = new Map(this.vaultData.accounts.map(a => [a.id, a]));
            const remoteMap = new Map(remoteData.accounts.map(a => [a.id, a]));

            // 添加远程新增的
            diff.added.forEach(acc => {
                localMap.set(acc.id, acc);
            });

            // 处理冲突：以最新为准
            diff.changed.forEach(item => {
                if (item.type === 'remote') {
                    localMap.set(item.account.id, item.account);
                }
            });

            this.vaultData.accounts = Array.from(localMap.values());
            this.vaultData.lastModified = new Date().toISOString();

            await this.pushToRemote();
            await this.saveLocalData();

            this.renderGroups();
            this.renderAccounts();

            this.closeSyncModal();
            this.showToast('同步完成');
        } catch (error) {
            this.showToast('同步失败: ' + error.message);
        }
    },

    /**
     * 推送到远程
     */
    async pushToRemote() {
        if (!this.config.gitee_token || !this.config.repo_url) {
            this.showToast('请先配置 Gitee');
            return;
        }

        try {
            this.showToast('正在推送...');
            this.toggleSyncIcon(true);

            // 获取当前文件的 SHA
            const fileInfo = await GiteeAPI.checkFileExists(
                this.config.gitee_token,
                this.config.repo_url
            );

            // 加密数据
            const encrypted = await CryptoModule.encryptData(
                this.masterKey,
                JSON.stringify(this.vaultData)
            );

            // 推送
            await GiteeAPI.pushLocal(
                this.config.gitee_token,
                this.config.repo_url,
                encrypted,
                fileInfo.sha
            );

            this.syncInfo = {
                synced: true,
                hasRemote: true,
                remote: this.vaultData,
                sha: fileInfo.sha,
                time: new Date().toLocaleString()
            };
            this.updateSyncStatus();

            this.showToast('推送成功');
        } catch (error) {
            console.error('推送失败:', error);
            this.showToast('推送失败: ' + error.message);
        } finally {
            this.toggleSyncIcon(false);
        }
    },

    /**
     * 切换同步图标状态
     */
    toggleSyncIcon(spinning) {
        const icon = document.getElementById('sync-icon');
        if (spinning) {
            icon.classList.add('spin');
        } else {
            icon.classList.remove('spin');
        }
    },

    // ============ 分享功能 ============

    /**
     * 显示分享弹窗
     */
    showShareModal() {
        // 更新选中数量
        const selected = this.selectedAccounts.length > 0 ? this.selectedAccounts : 
            [this.vaultData.accounts[0]?.id].filter(Boolean);

        if (selected.length === 0) {
            this.showToast('请先选择要分享的账号');
            return;
        }

        document.getElementById('selected-count').textContent = selected.length;
        document.getElementById('share-modal').classList.remove('hidden');
    },

    /**
     * 关闭分享弹窗
     */
    closeShareModal() {
        document.getElementById('share-modal').classList.add('hidden');
    },

    /**
     * 时序密码分享
     */
    async showShareByTotp() {
        const selectedAccounts = this.selectedAccounts.length > 0 ? 
            this.selectedAccounts : 
            [this.vaultData.accounts[0]?.id].filter(Boolean);

        if (selectedAccounts.length === 0) {
            this.showToast('请先选择要分享的账号');
            return;
        }

        try {
            this.showToast('正在准备分享...');

            // 生成分享 ID 和密钥
            const shareId = CryptoModule.generateUUID();
            const shareSecret = CryptoModule.generateShareSecret();

            // 获取选中的账号
            const accounts = this.vaultData.accounts.filter(a => selectedAccounts.includes(a.id));

            // 用分享密钥加密
            const shareContent = JSON.stringify({
                version: 1,
                accounts: accounts,
                createdAt: new Date().toISOString()
            });

            const encrypted = await CryptoModule.encryptData(shareSecret, shareContent);

            // 创建 Gist
            const gist = await GiteeAPI.createAnonymousGist(
                JSON.stringify(encrypted),
                'share.pwsafe',
                '密码分享 - 时序密码'
            );

            // 存储分享信息
            this.shareData = {
                type: 'totp',
                gistId: gist.id,
                gistUrl: gist.html_url,
                shareId: shareId,
                secret: shareSecret
            };

            // 显示面板
            this.closeShareModal();
            document.getElementById('totp-gist-url').value = gist.html_url;
            document.getElementById('totp-share-panel').classList.remove('hidden');

            // 启动时序密码定时器
            this.startTotpTimer();

        } catch (error) {
            this.showToast('分享失败: ' + error.message);
        }
    },

    /**
     * 启动时序密码定时器
     */
    async startTotpTimer() {
        const updatePassword = async () => {
            if (!this.shareData || !this.shareData.secret) return;

            const password = await CryptoModule.generateTotpPassword(
                this.shareData.shareId,
                this.shareData.secret
            );

            document.getElementById('totp-password').textContent = password;

            // 更新倒计时
            const remaining = CryptoModule.getTotpRemainingTime();
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            document.getElementById('totp-countdown').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        await updatePassword();
        this.totpInterval = setInterval(updatePassword, 1000);
    },

    /**
     * 停止时序密码定时器
     */
    stopTotpTimer() {
        if (this.totpInterval) {
            clearInterval(this.totpInterval);
            this.totpInterval = null;
        }
    },

    /**
     * 关闭时序密码分享
     */
    closeTotpShare() {
        this.stopTotpTimer();
        document.getElementById('totp-share-panel').classList.add('hidden');
        this.shareData = null;
    },

    /**
     * 复制时序密码
     */
    async copyTotpPassword() {
        const password = document.getElementById('totp-password').textContent;
        await this.copyToClipboard(password);
    },

    /**
     * Gist 分享
     */
    async showShareByGist() {
        const selectedAccounts = this.selectedAccounts.length > 0 ? 
            this.selectedAccounts : 
            [this.vaultData.accounts[0]?.id].filter(Boolean);

        if (selectedAccounts.length === 0) {
            this.showToast('请先选择要分享的账号');
            return;
        }

        try {
            this.showToast('正在准备分享...');

            // 生成提取密码
            const shareSecret = CryptoModule.generateShareSecret();

            // 获取选中的账号
            const accounts = this.vaultData.accounts.filter(a => selectedAccounts.includes(a.id));

            // 用分享密钥加密
            const shareContent = JSON.stringify({
                version: 1,
                accounts: accounts,
                createdAt: new Date().toISOString()
            });

            const encrypted = await CryptoModule.encryptData(shareSecret, shareContent);

            // 存储分享信息
            this.shareData = {
                type: 'gist',
                content: encrypted,
                secret: shareSecret
            };

            // 显示面板
            this.closeShareModal();
            document.getElementById('gist-share-key').value = shareSecret;
            document.getElementById('gist-share-url').value = '点击"复制并创建"生成链接';
            document.getElementById('gist-share-panel').classList.remove('hidden');

        } catch (error) {
            this.showToast('分享失败: ' + error.message);
        }
    },

    /**
     * 复制并创建 Gist
     */
    async copyAndCreateGist() {
        if (!this.shareData || !this.shareData.content) {
            this.showToast('分享数据已过期');
            return;
        }

        try {
            this.showToast('正在创建 Gist...');

            const gist = await GiteeAPI.createAnonymousGist(
                JSON.stringify(this.shareData.content),
                'share.pwsafe',
                '密码分享'
            );

            document.getElementById('gist-share-url').value = gist.html_url;
            await this.copyToClipboard(gist.html_url);
            this.showToast('链接已复制，请告知提取密码');

        } catch (error) {
            this.showToast('创建 Gist 失败: ' + error.message);
        }
    },

    /**
     * 关闭 Gist 分享
     */
    closeGistShare() {
        document.getElementById('gist-share-panel').classList.add('hidden');
        this.shareData = null;
    },

    /**
     * 本地导出
     */
    showShareByExport() {
        this.closeShareModal();
        document.getElementById('export-share-panel').classList.remove('hidden');
    },

    /**
     * 关闭本地导出
     */
    closeExportShare() {
        document.getElementById('export-share-panel').classList.add('hidden');
        document.getElementById('export-password').value = '';
        document.getElementById('export-password-confirm').value = '';
    },

    /**
     * 导出到文件
     */
    async exportToFile() {
        const password = document.getElementById('export-password').value;
        const passwordConfirm = document.getElementById('export-password-confirm').value;

        if (!password || password.length < 6) {
            this.showToast('密码至少需要6位');
            return;
        }

        if (password !== passwordConfirm) {
            this.showToast('两次密码不一致');
            return;
        }

        const selectedAccounts = this.selectedAccounts.length > 0 ? 
            this.selectedAccounts : 
            this.vaultData.accounts.map(a => a.id);

        try {
            this.showToast('正在导出...');

            // 获取选中的账号
            const accounts = this.vaultData.accounts.filter(a => selectedAccounts.includes(a.id));

            // 用自定义密码加密
            const exportContent = JSON.stringify({
                version: 1,
                format: 'pwsafe-export',
                accounts: accounts,
                exportedAt: new Date().toISOString()
            });

            const encrypted = await CryptoModule.encryptData(password, exportContent);

            // 创建下载
            const blob = new Blob([JSON.stringify(encrypted, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pwsafe-backup-${new Date().toISOString().slice(0, 10)}.pwsafe`;
            a.click();
            URL.revokeObjectURL(url);

            this.closeExportShare();
            this.showToast('导出成功，请妥善保管密码');

        } catch (error) {
            this.showToast('导出失败: ' + error.message);
        }
    },

    /**
     * 接收分享
     */
    showImportShare() {
        document.getElementById('import-share-modal').classList.remove('hidden');
    },

    /**
     * 关闭接收分享
     */
    closeImportShare() {
        document.getElementById('import-share-modal').classList.add('hidden');
        document.getElementById('import-url').value = '';
        document.getElementById('import-password').value = '';
        document.getElementById('import-preview').classList.add('hidden');
        document.getElementById('import-preview').innerHTML = '';
        document.getElementById('import-decrypt-btn').style.display = 'block';
        document.getElementById('import-confirm-btn').style.display = 'none';
        this._importData = null;
    },

    /**
     * 解密并预览分享内容
     */
    async importShare() {
        const urlOrId = document.getElementById('import-url').value.trim();
        const password = document.getElementById('import-password').value;

        if (!urlOrId) {
            this.showToast('请输入分享链接');
            return;
        }

        if (!password) {
            this.showToast('请输入提取密码');
            return;
        }

        try {
            this.showToast('正在解密...');

            // 提取 Gist ID
            const gistId = GiteeAPI.extractGistId(urlOrId);
            if (!gistId) {
                throw new Error('无效的分享链接');
            }

            // 获取 Gist 内容
            const gist = await GiteeAPI.getGist(gistId);
            const content = gist.files['share.pwsafe']?.content;

            if (!content) {
                throw new Error('分享内容不存在');
            }

            // 解密
            const encrypted = JSON.parse(content);
            const decrypted = await CryptoModule.decryptData(password, encrypted);
            const shareData = JSON.parse(decrypted);

            // 显示预览
            const preview = document.getElementById('import-preview');
            let html = '<p style="margin-bottom: 12px;">分享内容：</p>';

            shareData.accounts.forEach(acc => {
                html += `
                    <div class="import-preview-item">
                        <span>${acc.title}</span>
                        <span style="color: var(--text-muted);">${acc.username}</span>
                    </div>
                `;
            });

            preview.innerHTML = html;
            preview.classList.remove('hidden');

            // 显示确认导入按钮
            document.getElementById('import-decrypt-btn').style.display = 'none';
            document.getElementById('import-confirm-btn').style.display = 'block';

            // 存储分享数据供确认导入使用
            this._importData = shareData;
            this.showToast('解密成功，确认导入？');

        } catch (error) {
            this.showToast('解密失败: ' + error.message);
            document.getElementById('import-preview').classList.add('hidden');
        }
    },

    /**
     * 确认导入分享内容
     */
    confirmImport() {
        if (!this._importData) {
            this.showToast('没有可导入的内容');
            return;
        }

        // 添加到本地数据
        this._importData.accounts.forEach(acc => {
            const newAccount = {
                ...acc,
                id: CryptoModule.generateUUID(), // 生成新 ID
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.vaultData.accounts.push(newAccount);
        });

        this.vaultData.lastModified = new Date().toISOString();
        this.saveLocalData();

        this.closeImportShare();
        this.renderGroups();
        this.renderAccounts();
        this.showToast('导入成功');
    },

    // ============ 复制文本工具 ============

    /**
     * 复制指定 ID 的文本
     */
    async copyText(inputId) {
        const text = document.getElementById(inputId).value;
        await this.copyToClipboard(text);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
