/**
 * 密码保险箱 - 加密模块
 * 使用 Web Crypto API 实现安全加密
 */

const CryptoModule = {
    // 加密配置
    config: {
        pbkdf2Iterations: 100000,
        pbkdf2Hash: 'SHA-256',
        keyLength: 256,
        saltLength: 16,
        ivLength: 12,
        tagLength: 128
    },

    /**
     * 生成随机盐值
     */
    generateSalt() {
        return crypto.getRandomValues(new Uint8Array(this.config.saltLength));
    },

    /**
     * 生成随机 IV
     */
    generateIV() {
        return crypto.getRandomValues(new Uint8Array(this.config.ivLength));
    },

    /**
     * 生成随机 UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * ArrayBuffer 转 Base64
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    /**
     * Base64 转 ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    },

    /**
     * TextEncoder 转字符串
     */
    textEncoder: new TextEncoder(),

    /**
     * PBKDF2 密钥派生
     * @param {string} password - 主密钥
     * @param {Uint8Array} salt - 盐值
     * @returns {Promise<CryptoKey>}
     */
    async deriveKey(password, salt) {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            this.textEncoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.config.pbkdf2Iterations,
                hash: this.config.pbkdf2Hash
            },
            keyMaterial,
            {
                name: 'AES-GCM',
                length: this.config.keyLength
            },
            false,
            ['encrypt', 'decrypt']
        );
    },

    /**
     * 生成 HMAC 密钥
     * @param {string} password - 密钥
     * @param {Uint8Array} salt - 盐值
     * @returns {Promise<CryptoKey>}
     */
    async deriveHmacKey(password, salt) {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            this.textEncoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits']
        );

        const bits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.config.pbkdf2Iterations,
                hash: this.config.pbkdf2Hash
            },
            keyMaterial,
            256
        );

        return crypto.subtle.importKey(
            'raw',
            bits,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
    },

    /**
     * AES-GCM 加密
     * @param {CryptoKey} key - 加密密钥
     * @param {string} plaintext - 明文
     * @param {Uint8Array} iv - 初始向量
     * @returns {Promise<ArrayBuffer>} - 密文（包含认证标签）
     */
    async encrypt(key, plaintext, iv) {
        const encoded = this.textEncoder.encode(plaintext);
        return crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
                tagLength: this.config.tagLength
            },
            key,
            encoded
        );
    },

    /**
     * AES-GCM 解密
     * @param {CryptoKey} key - 解密密钥
     * @param {ArrayBuffer} ciphertext - 密文
     * @param {Uint8Array} iv - 初始向量
     * @returns {Promise<string>} - 明文
     */
    async decrypt(key, ciphertext, iv) {
        try {
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                    tagLength: this.config.tagLength
                },
                key,
                ciphertext
            );
            return new TextDecoder().decode(decrypted);
        } catch (e) {
            throw new Error('解密失败，密钥可能不正确');
        }
    },

    /**
     * 计算 HMAC
     * @param {CryptoKey} hmacKey - HMAC 密钥
     * @param {string} data - 数据
     * @returns {Promise<string>} - Base64 编码的 HMAC
     */
    async computeHmac(hmacKey, data) {
        const encoded = this.textEncoder.encode(data);
        const signature = await crypto.subtle.sign('HMAC', hmacKey, encoded);
        return this.arrayBufferToBase64(signature);
    },

    /**
     * 验证 HMAC
     * @param {CryptoKey} hmacKey - HMAC 密钥
     * @param {string} data - 数据
     * @param {string} expectedHmac - 期望的 HMAC
     * @returns {Promise<boolean>}
     */
    async verifyHmac(hmacKey, data, expectedHmac) {
        const computed = await this.computeHmac(hmacKey, data);
        return computed === expectedHmac;
    },

    /**
     * SHA-256 哈希
     * @param {string} data - 数据
     * @returns {Promise<string>} - Base64 编码的哈希
     */
    async sha256(data) {
        const encoded = this.textEncoder.encode(data);
        const hash = await crypto.subtle.digest('SHA-256', encoded);
        return this.arrayBufferToBase64(hash);
    },

    /**
     * 加密数据并打包
     * @param {string} masterKey - 主密钥
     * @param {string} plaintext - 明文数据
     * @returns {Promise<object>} - 加密后的数据对象
     */
    async encryptData(masterKey, plaintext) {
        const salt = this.generateSalt();
        const iv = this.generateIV();

        // 派生加密密钥
        const key = await this.deriveKey(masterKey, salt);
        const hmacKey = await this.deriveHmacKey(masterKey, salt);

        // 加密数据
        const ciphertext = await this.encrypt(key, plaintext, iv);

        // 计算完整性校验
        const hmac = await this.computeHmac(hmacKey, this.arrayBufferToBase64(ciphertext));

        return {
            version: 1,
            format: 'pwsafe-v1',
            encrypted: {
                iv: this.arrayBufferToBase64(iv),
                salt: this.arrayBufferToBase64(salt),
                data: this.arrayBufferToBase64(ciphertext)
            },
            hmac: hmac,
            lastModified: new Date().toISOString()
        };
    },

    /**
     * 解密数据
     * @param {string} masterKey - 主密钥
     * @param {object} encryptedData - 加密的数据对象
     * @returns {Promise<string>} - 明文数据
     */
    async decryptData(masterKey, encryptedData) {
        const iv = new Uint8Array(this.base64ToArrayBuffer(encryptedData.encrypted.iv));
        const salt = new Uint8Array(this.base64ToArrayBuffer(encryptedData.encrypted.salt));
        const ciphertext = this.base64ToArrayBuffer(encryptedData.encrypted.data);

        // 派生解密密钥
        const key = await this.deriveKey(masterKey, salt);
        const hmacKey = await this.deriveHmacKey(masterKey, salt);

        // 验证完整性
        const isValid = await this.verifyHmac(hmacKey, encryptedData.encrypted.data, encryptedData.hmac);
        if (!isValid) {
            throw new Error('数据完整性校验失败，可能已被篡改');
        }

        // 解密数据
        return this.decrypt(key, ciphertext, iv);
    },

    /**
     * 生成时序密码（基于 HMAC 的动态密码）
     * @param {string} shareId - 分享 ID
     * @param {string} secret - 分享密钥
     * @returns {Promise<string>} - 8位密码
     */
    async generateTotpPassword(shareId, secret) {
        const windowSeconds = 300; // 5分钟一个窗口
        const window = Math.floor(Date.now() / 1000 / windowSeconds);

        const combinedData = shareId + window.toString();
        const encoded = this.textEncoder.encode(combinedData);

        // 使用 HMAC-SHA256 生成签名
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            this.textEncoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', keyMaterial, encoded);
        const bytes = new Uint8Array(signature);

        // 取前6字节转换为密码
        const password = [];
        let offset = bytes[0] & 0xf;
        for (let i = 0; i < 6; i++) {
            password.push('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[(bytes[offset + i] & 0x7f) % 32]);
        }

        return password.join('').slice(0, 8);
    },

    /**
     * 验证时序密码（允许 ±1 窗口容错）
     * @param {string} shareId - 分享 ID
     * @param {string} inputPassword - 输入的密码
     * @param {string} secret - 分享密钥
     * @returns {Promise<{valid: boolean, window: number}>}
     */
    async verifyTotpPassword(shareId, inputPassword, secret) {
        const windowSeconds = 300;
        const currentWindow = Math.floor(Date.now() / 1000 / windowSeconds);

        for (let offset = -1; offset <= 1; offset++) {
            const expected = await this.generateTotpPassword(shareId, secret);
            if (expected === inputPassword) {
                return { valid: true, window: currentWindow + offset };
            }
            // 移动到下一个时间窗口重新生成
            if (offset === -1 || offset === 0) {
                // 重新计算（因为 generateTotpPassword 内部使用 Date.now()）
                const testWindow = currentWindow + offset;
                const combinedData = shareId + testWindow.toString();
                const encoded = this.textEncoder.encode(combinedData);
                
                const keyMaterial = await crypto.subtle.importKey(
                    'raw',
                    this.textEncoder.encode(secret),
                    { name: 'HMAC', hash: 'SHA-256' },
                    false,
                    ['sign']
                );

                const signature = await crypto.subtle.sign('HMAC', keyMaterial, encoded);
                const bytes = new Uint8Array(signature);

                const password = [];
                let off = bytes[0] & 0xf;
                for (let i = 0; i < 6; i++) {
                    password.push('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[(bytes[off + i] & 0x7f) % 32]);
                }
                const expectedPassword = password.join('').slice(0, 8);

                if (expectedPassword === inputPassword) {
                    return { valid: true, window: testWindow };
                }
            }
        }

        return { valid: false, window: null };
    },

    /**
     * 获取时序密码的剩余时间（秒）
     */
    getTotpRemainingTime() {
        const windowSeconds = 300;
        const elapsed = Math.floor(Date.now() / 1000) % windowSeconds;
        return windowSeconds - elapsed;
    },

    /**
     * 生成随机密码
     * @param {number} length - 密码长度
     * @returns {string}
     */
    generatePassword(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        const random = crypto.getRandomValues(new Uint8Array(length));
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars[random[i] % chars.length];
        }
        return password;
    },

    /**
     * 生成随机分享密钥
     * @returns {string}
     */
    generateShareSecret() {
        const random = crypto.getRandomValues(new Uint8Array(24));
        return this.arrayBufferToBase64(random).replace(/[/+=]/g, '');
    },

    /**
     * 快速验证主密钥（通过存储的哈希）
     * @param {string} inputKey - 输入的密钥
     * @param {string} storedHash - 存储的哈希
     * @returns {Promise<boolean>}
     */
    async verifyMasterKey(inputKey, storedHash) {
        const hash = await this.sha256(inputKey);
        return hash === storedHash;
    },

    /**
     * 为主密钥生成快速验证哈希
     * @param {string} masterKey
     * @returns {Promise<string>}
     */
    async hashMasterKey(masterKey) {
        return this.sha256(masterKey);
    }
};

// 导出到全局
window.CryptoModule = CryptoModule;
