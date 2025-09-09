const COS = require('cos-nodejs-sdk-v5');
const BaseAdapter = require('./BaseAdapter');

/**
 * 腾讯云COS适配器
 */
class TencentCOSAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.cos = new COS({
            SecretId: config.accessKeyId,
            SecretKey: config.accessKeySecret,
        });
        this.bucket = config.bucket;
        this.region = config.region;
    }

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

    getSignedUrl(key, expires = 3600) {
        return this.cos.getObjectUrl({
            Bucket: this.bucket,
            Region: this.region,
            Key: key,
            Sign: true,
            Expires: expires,
        });
    }

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

    async testConnection(config) {
        try {
            const testCos = new COS({
                SecretId: config.accessKeyId,
                SecretKey: config.accessKeySecret,
            });

            return new Promise((resolve, reject) => {
                testCos.getBucket({
                    Bucket: config.bucket,
                    Region: config.region,
                    MaxKeys: 1
                }, (err, data) => {
                    if (err) {
                        console.error('腾讯云COS连接测试失败:', err);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            console.error('腾讯云COS连接测试异常:', error);
            return false;
        }
    }

    getProviderName() {
        return '腾讯云COS';
    }

    getSupportedRegions() {
        return [
            { value: 'ap-beijing', label: '北京' },
            { value: 'ap-shanghai', label: '上海' },
            { value: 'ap-guangzhou', label: '广州' },
            { value: 'ap-chengdu', label: '成都' },
            { value: 'ap-chongqing', label: '重庆' },
            { value: 'ap-shenzhen-fsi', label: '深圳金融' },
            { value: 'ap-shanghai-fsi', label: '上海金融' },
            { value: 'ap-beijing-fsi', label: '北京金融' },
            { value: 'ap-hongkong', label: '香港' },
            { value: 'ap-singapore', label: '新加坡' },
            { value: 'ap-mumbai', label: '孟买' },
            { value: 'ap-seoul', label: '首尔' },
            { value: 'ap-tokyo', label: '东京' },
            { value: 'na-siliconvalley', label: '硅谷' },
            { value: 'na-ashburn', label: '弗吉尼亚' },
            { value: 'eu-frankfurt', label: '法兰克福' }
        ];
    }

    getRequiredConfig() {
        return ['accessKeyId', 'accessKeySecret', 'bucket', 'region'];
    }
}

module.exports = TencentCOSAdapter;
