const OBS = require('esdk-obs-nodejs');
const BaseAdapter = require('./BaseAdapter');

/**
 * 华为云OBS适配器
 */
class HuaweiOBSAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.obsClient = new OBS({
            access_key_id: config.accessKeyId,
            secret_access_key: config.accessKeySecret,
            server: `https://obs.${config.region}.myhuaweicloud.com`,
            bucket: config.bucket
        });
    }

    async uploadFile(filePath, key) {
        return new Promise((resolve, reject) => {
            this.obsClient.putObject({
                Bucket: this.config.bucket,
                Key: key,
                SourceFile: filePath
            }, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async downloadFile(key, localPath) {
        return new Promise((resolve, reject) => {
            this.obsClient.getObject({
                Bucket: this.config.bucket,
                Key: key,
                SaveAsFile: localPath
            }, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async deleteFile(key) {
        return new Promise((resolve, reject) => {
            this.obsClient.deleteObject({
                Bucket: this.config.bucket,
                Key: key
            }, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    getSignedUrl(key, expires = 3600) {
        return this.obsClient.createSignedUrlSync({
            Method: 'GET',
            Bucket: this.config.bucket,
            Key: key,
            Expires: expires
        });
    }

    async fileExists(key) {
        return new Promise((resolve, reject) => {
            this.obsClient.headObject({
                Bucket: this.config.bucket,
                Key: key
            }, (err, result) => {
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
            const testClient = new OBS({
                access_key_id: config.accessKeyId,
                secret_access_key: config.accessKeySecret,
                server: `https://obs.${config.region}.myhuaweicloud.com`,
                bucket: config.bucket
            });
            
            return new Promise((resolve, reject) => {
                testClient.headBucket({
                    Bucket: config.bucket
                }, (err, result) => {
                    if (err) {
                        console.error('华为云OBS连接测试失败:', err);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            console.error('华为云OBS连接测试异常:', error);
            return false;
        }
    }

    getProviderName() {
        return '华为云OBS';
    }

    getSupportedRegions() {
        return [
            { value: 'cn-north-1', label: '华北-北京一' },
            { value: 'cn-north-4', label: '华北-北京四' },
            { value: 'cn-north-9', label: '华北-乌兰察布一' },
            { value: 'cn-east-2', label: '华东-上海二' },
            { value: 'cn-east-3', label: '华东-上海一' },
            { value: 'cn-south-1', label: '华南-广州' },
            { value: 'cn-south-2', label: '华南-深圳' },
            { value: 'cn-southwest-2', label: '西南-贵阳一' },
            { value: 'ap-southeast-1', label: '亚太-新加坡' },
            { value: 'ap-southeast-2', label: '亚太-曼谷' },
            { value: 'ap-southeast-3', label: '亚太-雅加达' },
            { value: 'af-south-1', label: '非洲-约翰内斯堡' },
            { value: 'la-south-2', label: '拉美-墨西哥城二' },
            { value: 'la-north-2', label: '拉美-圣保罗一' },
            { value: 'na-mexico-1', label: '拉美-墨西哥城一' },
            { value: 'sa-brazil-1', label: '拉美-圣保罗一' },
            { value: 'la-south-1', label: '拉美-圣地亚哥' },
            { value: 'cn-south-4', label: '华南-广州-友好用户环境' },
            { value: 'cn-north-1', label: '华北-北京一' },
            { value: 'cn-north-2', label: '华北-北京二' },
            { value: 'cn-north-4', label: '华北-北京四' },
            { value: 'cn-north-9', label: '华北-乌兰察布一' },
            { value: 'cn-east-2', label: '华东-上海二' },
            { value: 'cn-east-3', label: '华东-上海一' },
            { value: 'cn-south-1', label: '华南-广州' },
            { value: 'cn-south-2', label: '华南-深圳' },
            { value: 'cn-southwest-2', label: '西南-贵阳一' }
        ];
    }

    getRequiredConfig() {
        return ['accessKeyId', 'accessKeySecret', 'bucket', 'region'];
    }
}

module.exports = HuaweiOBSAdapter;
