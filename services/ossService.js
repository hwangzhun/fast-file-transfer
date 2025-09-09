const COS = require('cos-nodejs-sdk-v5');

class OSSService {
    constructor() {
        this.cos = new COS({
            SecretId: process.env.TENCENT_SECRET_ID,
            SecretKey: process.env.TENCENT_SECRET_KEY,
        });
        this.bucket = process.env.TENCENT_BUCKET;
        this.region = process.env.TENCENT_REGION || 'ap-beijing';
    }

    // 上传文件到腾讯云OSS
    async uploadFile(filePath, key) {
        return new Promise((resolve, reject) => {
            this.cos.putObject({
                Bucket: this.bucket,
                Region: this.region,
                Key: key,
                Body: require('fs').createReadStream(filePath),
            }, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    // 从腾讯云OSS下载文件
    async downloadFile(key, localPath) {
        return new Promise((resolve, reject) => {
            this.cos.getObject({
                Bucket: this.bucket,
                Region: this.region,
                Key: key,
                Output: require('fs').createWriteStream(localPath),
            }, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    // 删除腾讯云OSS文件
    async deleteFile(key) {
        return new Promise((resolve, reject) => {
            this.cos.deleteObject({
                Bucket: this.bucket,
                Region: this.region,
                Key: key,
            }, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    // 生成预签名URL（用于直接下载）
    getSignedUrl(key, expires = 3600) {
        return this.cos.getObjectUrl({
            Bucket: this.bucket,
            Region: this.region,
            Key: key,
            Sign: true,
            Expires: expires,
        });
    }

    // 检查文件是否存在
    async fileExists(key) {
        return new Promise((resolve, reject) => {
            this.cos.headObject({
                Bucket: this.bucket,
                Region: this.region,
                Key: key,
            }, (err, data) => {
                if (err) {
                    if (err.statusCode === 404) {
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

    // 测试连接
    async testConnection(config) {
        try {
            const testCos = new COS({
                SecretId: config.secretId,
                SecretKey: config.secretKey,
            });

            // 尝试列出存储桶
            return new Promise((resolve, reject) => {
                testCos.getBucket({
                    Bucket: config.bucket,
                    Region: config.region,
                    MaxKeys: 1
                }, (err, data) => {
                    if (err) {
                        console.error('OSS连接测试失败:', err);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            console.error('OSS连接测试异常:', error);
            return false;
        }
    }

    // 使用自定义配置创建COS实例
    createCosInstance(config) {
        return new COS({
            SecretId: config.secretId,
            SecretKey: config.secretKey,
        });
    }
}

module.exports = new OSSService();
