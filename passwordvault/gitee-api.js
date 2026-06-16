/**
 * Gitee API 模块
 * 处理与 Gitee 的同步和分享功能
 */

const GiteeAPI = {
    // API 基础地址
    baseURL: 'https://gitee.com/api/v5',

    // 文件名
    VAULT_FILE: 'pwsafe.json',

    /**
     * 从仓库 URL 解析 owner 和 repo
     * @param {string} repoUrl - 仓库地址
     * @returns {{owner: string, repo: string}}
     */
    parseRepoUrl(repoUrl) {
        // 支持格式：
        // https://gitee.com/owner/repo
        // https://gitee.com/owner/repo.git
        // owner/repo
        const match = repoUrl.match(/gitee\.com\/([^\/]+)\/([^\/\.]+)/);
        if (match) {
            return { owner: match[1], repo: match[2] };
        }
        throw new Error('无效的仓库地址');
    },

    /**
     * 通用请求方法
     */
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `请求失败: ${response.status}`);
        }

        // HEAD 请求不返回 body
        if (response.status === 204) {
            return null;
        }

        return response.json();
    },

    /**
     * 获取文件内容
     * @param {string} token - Gitee 令牌
     * @param {string} repoUrl - 仓库地址
     * @param {string} path - 文件路径
     * @returns {Promise<object|null>}
     */
    async getFile(token, repoUrl, path = this.VAULT_FILE) {
        try {
            const { owner, repo } = this.parseRepoUrl(repoUrl);
            const encodedPath = encodeURIComponent(path);

            const url = `${this.baseURL}/repos/${owner}/${repo}/contents/${encodedPath}`;
            const data = await this.request(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Gitee 返回 base64 编码的内容
            return {
                content: JSON.parse(atob(data.content)),
                sha: data.sha,
                lastModified: data.updated_at
            };
        } catch (error) {
            if (error.message.includes('404')) {
                return null; // 文件不存在
            }
            throw error;
        }
    },

    /**
     * 创建或更新文件
     * @param {string} token - Gitee 令牌
     * @param {string} repoUrl - 仓库地址
     * @param {object} content - 文件内容
     * @param {string} sha - 文件 SHA（更新时需要）
     * @param {string} path - 文件路径
     * @returns {Promise<object>}
     */
    async saveFile(token, repoUrl, content, sha = null, path = this.VAULT_FILE) {
        const { owner, repo } = this.parseRepoUrl(repoUrl);
        const encodedPath = encodeURIComponent(path);

        const url = `${this.baseURL}/repos/${owner}/${repo}/contents/${encodedPath}`;
        const body = {
            access_token: token,
            content: JSON.stringify(content, null, 2),
            message: `更新密码数据 - ${new Date().toLocaleString()}`
        };

        if (sha) {
            body.sha = sha; // 更新时需要提供 SHA
        }

        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    /**
     * 检查文件是否存在
     * @param {string} token - Gitee 令牌
     * @param {string} repoUrl - 仓库地址
     * @param {string} path - 文件路径
     * @returns {Promise<{exists: boolean, sha: string|null}>}
     */
    async checkFileExists(token, repoUrl, path = this.VAULT_FILE) {
        try {
            const file = await this.getFile(token, repoUrl, path);
            return {
                exists: true,
                sha: file.sha
            };
        } catch (error) {
            if (error.message.includes('404')) {
                return { exists: false, sha: null };
            }
            throw error;
        }
    },

    /**
     * 创建匿名 Gist
     * @param {string} content - Gist 内容
     * @param {string} filename - 文件名
     * @param {string} description - 描述
     * @returns {Promise<{id: string, htmlUrl: string}>}
     */
    async createAnonymousGist(content, filename = 'share.pwsafe', description = '密码分享') {
        const url = `${this.baseURL}/gists`;

        const body = {
            public: false, // 私密 Gist
            files: {
                [filename]: {
                    content: content
                }
            },
            description: description
        };

        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    /**
     * 获取 Gist 内容
     * @param {string} gistId - Gist ID
     * @returns {Promise<object>}
     */
    async getGist(gistId) {
        const url = `${this.baseURL}/gists/${gistId}`;
        return this.request(url);
    },

    /**
     * 从 URL 提取 Gist ID
     * @param {string} urlOrId - Gist URL 或 ID
     * @returns {string|null}
     */
    extractGistId(urlOrId) {
        // 格式1: https://gitee.com/xxx/gist/abc123
        // 格式2: abc123 (直接是 ID)
        const match = urlOrId.match(/gist\/([^\/\?]+)/);
        if (match) {
            return match[1];
        }

        // 如果直接是 ID 格式
        if (/^[a-f0-9]{32}$/i.test(urlOrId) || /^[a-zA-Z0-9_-]+$/.test(urlOrId)) {
            return urlOrId;
        }

        return null;
    },

    /**
     * 验证 Gitee Token
     * @param {string} token - Gitee 令牌
     * @returns {Promise<{valid: boolean, user: object|null}>}
     */
    async verifyToken(token) {
        try {
            const url = `${this.baseURL}/user`;
            const user = await this.request(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return { valid: true, user };
        } catch (error) {
            return { valid: false, user: null };
        }
    },

    /**
     * 验证仓库访问权限
     * @param {string} token - Gitee 令牌
     * @param {string} repoUrl - 仓库地址
     * @returns {Promise<{valid: boolean, message: string}>}
     */
    async verifyRepoAccess(token, repoUrl) {
        try {
            const { owner, repo } = this.parseRepoUrl(repoUrl);
            const url = `${this.baseURL}/repos/${owner}/${repo}`;

            const repoData = await this.request(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (repoData.permissions && repoData.permissions.push) {
                return { valid: true, message: '仓库可读写' };
            }

            return { valid: false, message: '仓库无写权限' };
        } catch (error) {
            return { valid: false, message: error.message };
        }
    },

    /**
     * 拉取远程数据
     * @param {string} token - Gitee 令牌
     * @param {string} repoUrl - 仓库地址
     * @returns {Promise<object|null>}
     */
    async pullRemote(token, repoUrl) {
        const file = await this.getFile(token, repoUrl);
        if (!file) {
            return null; // 远程无数据
        }
        return {
            data: file.content,
            sha: file.sha,
            lastModified: file.lastModified
        };
    },

    /**
     * 推送本地数据
     * @param {string} token - Gitee 令牌
     * @param {string} repoUrl - 仓库地址
     * @param {object} data - 要推送的数据
     * @param {string} sha - 文件 SHA（可选，更新时需要）
     * @returns {Promise<object>}
     */
    async pushLocal(token, repoUrl, data, sha = null) {
        return this.saveFile(token, repoUrl, data, sha);
    }
};

// 导出到全局
window.GiteeAPI = GiteeAPI;
