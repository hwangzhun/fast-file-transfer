/**
 * OSS服务基础适配器
 * 定义所有OSS服务必须实现的标准接口
 */
class BaseAdapter {
    constructor(config) {
        this.config = config;
    }

    /**
     * 上传文件
     * @param {string} filePath - 本地文件路径
     * @param {string} key - 远程文件键名
     * @returns {Promise<Object>} 上传结果
     */
    async uploadFile(filePath, key) {
        throw new Error('uploadFile method must be implemented');
    }

    /**
     * 下载文件
     * @param {string} key - 远程文件键名
     * @param {string} localPath - 本地保存路径
     * @returns {Promise<Object>} 下载结果
     */
    async downloadFile(key, localPath) {
        throw new Error('downloadFile method must be implemented');
    }

    /**
     * 删除文件
     * @param {string} key - 远程文件键名
     * @returns {Promise<Object>} 删除结果
     */
    async deleteFile(key) {
        throw new Error('deleteFile method must be implemented');
    }

    /**
     * 生成预签名URL
     * @param {string} key - 远程文件键名
     * @param {number} expires - 过期时间（秒）
     * @returns {string} 预签名URL
     */
    getSignedUrl(key, expires = 3600) {
        throw new Error('getSignedUrl method must be implemented');
    }

    /**
     * 检查文件是否存在
     * @param {string} key - 远程文件键名
     * @returns {Promise<boolean>} 文件是否存在
     */
    async fileExists(key) {
        throw new Error('fileExists method must be implemented');
    }

    /**
     * 测试连接
     * @param {Object} config - 配置信息
     * @returns {Promise<boolean>} 连接是否成功
     */
    async testConnection(config) {
        throw new Error('testConnection method must be implemented');
    }

    /**
     * 获取服务商名称
     * @returns {string} 服务商名称
     */
    getProviderName() {
        throw new Error('getProviderName method must be implemented');
    }

    /**
     * 获取支持的地域列表
     * @returns {Array} 地域列表
     */
    getSupportedRegions() {
        throw new Error('getSupportedRegions method must be implemented');
    }

    /**
     * 验证配置
     * @param {Object} config - 配置信息
     * @returns {Object} 验证结果
     */
    validateConfig(config) {
        const required = this.getRequiredConfig();
        const missing = required.filter(field => !config[field]);
        
        return {
            valid: missing.length === 0,
            missing: missing
        };
    }

    /**
     * 获取必需的配置字段
     * @returns {Array} 必需字段列表
     */
    getRequiredConfig() {
        return ['accessKeyId', 'accessKeySecret', 'bucket', 'region'];
    }
}

module.exports = BaseAdapter;
