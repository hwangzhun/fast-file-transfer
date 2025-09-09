const qiniu = require('qiniu');
const BaseAdapter = require('./BaseAdapter');

/**
 * 七牛云Kodo适配器
 */
class QiniuKodoAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.mac = new qiniu.auth.digest.Mac(config.accessKeyId, config.accessKeySecret);
        this.config = config;
    }

    async uploadFile(filePath, key) {
        const config = new qiniu.conf.Config();
        const formUploader = new qiniu.form_up.FormUploader(config);
        const putExtra = new qiniu.form_up.PutExtra();
        
        return new Promise((resolve, reject) => {
            const putPolicy = new qiniu.rs.PutPolicy({
                scope: `${this.config.bucket}:${key}`
            });
            const uploadToken = putPolicy.uploadToken(this.mac);
            
            formUploader.putFile(uploadToken, key, filePath, putExtra, (err, body, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ body, info });
                }
            });
        });
    }

    async downloadFile(key, localPath) {
        const config = new qiniu.conf.Config();
        const bucketManager = new qiniu.rs.BucketManager(this.mac, config);
        
        return new Promise((resolve, reject) => {
            bucketManager.download(this.config.bucket, key, localPath, (err, ret) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(ret);
                }
            });
        });
    }

    async deleteFile(key) {
        const config = new qiniu.conf.Config();
        const bucketManager = new qiniu.rs.BucketManager(this.mac, config);
        
        return new Promise((resolve, reject) => {
            bucketManager.delete(this.config.bucket, key, (err, ret) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(ret);
                }
            });
        });
    }

    getSignedUrl(key, expires = 3600) {
        const config = new qiniu.conf.Config();
        const bucketManager = new qiniu.rs.BucketManager(this.mac, config);
        const deadline = Math.floor(Date.now() / 1000) + expires;
        
        return bucketManager.privateDownloadUrl(this.config.domain, key, deadline);
    }

    async fileExists(key) {
        const config = new qiniu.conf.Config();
        const bucketManager = new qiniu.rs.BucketManager(this.mac, config);
        
        return new Promise((resolve, reject) => {
            bucketManager.stat(this.config.bucket, key, (err, ret, info) => {
                if (err) {
                    if (info && info.statusCode === 612) {
                        resolve(false);
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(true);
                }
            });
        });
    }

    async testConnection(config) {
        try {
            const testMac = new qiniu.auth.digest.Mac(config.accessKeyId, config.accessKeySecret);
            const testConfig = new qiniu.conf.Config();
            const bucketManager = new qiniu.rs.BucketManager(testMac, testConfig);
            
            return new Promise((resolve, reject) => {
                bucketManager.getBucketInfo(config.bucket, (err, ret) => {
                    if (err) {
                        console.error('七牛云Kodo连接测试失败:', err);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            console.error('七牛云Kodo连接测试异常:', error);
            return false;
        }
    }

    getProviderName() {
        return '七牛云Kodo';
    }

    getSupportedRegions() {
        return [
            { value: 'z0', label: '华东' },
            { value: 'z1', label: '华北' },
            { value: 'z2', label: '华南' },
            { value: 'na0', label: '北美' },
            { value: 'as0', label: '东南亚' }
        ];
    }

    getRequiredConfig() {
        return ['accessKeyId', 'accessKeySecret', 'bucket', 'domain'];
    }

    validateConfig(config) {
        const required = this.getRequiredConfig();
        const missing = required.filter(field => !config[field]);
        
        return {
            valid: missing.length === 0,
            missing: missing
        };
    }
}

module.exports = QiniuKodoAdapter;
