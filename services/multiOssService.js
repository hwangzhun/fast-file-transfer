const COS = require('cos-nodejs-sdk-v5'); // 腾讯云
const OSS = require('ali-oss'); // 阿里云
const AWS = require('aws-sdk'); // AWS S3
const qiniu = require('qiniu'); // 七牛云

class MultiOssService {
    constructor() {
        this.platforms = {
            'tencent': {
                name: '腾讯云COS',
                sdk: COS,
                configFields: ['secretId', 'secretKey', 'region', 'bucket'],
                regionFormat: 'ap-beijing',
                endpointFormat: 'https://cos.{region}.myqcloud.com'
            },
            'aliyun': {
                name: '阿里云OSS',
                sdk: OSS,
                configFields: ['accessKeyId', 'accessKeySecret', 'region', 'bucket'],
                regionFormat: 'oss-cn-hangzhou',
                endpointFormat: 'https://oss-{region}.aliyuncs.com'
            },
            'huawei': {
                name: '华为云OBS',
                sdk: null, // 需要单独实现
                configFields: ['accessKey', 'secretKey', 'region', 'bucket'],
                regionFormat: 'cn-north-4',
                endpointFormat: 'https://obs.{region}.myhuaweicloud.com'
            },
            'qiniu': {
                name: '七牛云Kodo',
                sdk: qiniu,
                configFields: ['accessKey', 'secretKey', 'region', 'bucket'],
                regionFormat: 'z0',
                endpointFormat: 'https://upload-{region}.qiniup.com'
            },
            'aws': {
                name: 'AWS S3',
                sdk: AWS,
                configFields: ['accessKeyId', 'secretAccessKey', 'region', 'bucket'],
                regionFormat: 'us-east-1',
                endpointFormat: 'https://s3.{region}.amazonaws.com'
            }
        };
    }

    // 获取支持的平台列表
    getSupportedPlatforms() {
        return Object.keys(this.platforms).map(key => ({
            value: key,
            name: this.platforms[key].name,
            configFields: this.platforms[key].configFields
        }));
    }

    // 获取平台配置字段
    getPlatformConfigFields(platform) {
        if (!this.platforms[platform]) {
            throw new Error(`不支持的OSS平台: ${platform}`);
        }
        return this.platforms[platform].configFields;
    }

    // 创建平台实例
    createPlatformInstance(platform, config) {
        if (!this.platforms[platform]) {
            throw new Error(`不支持的OSS平台: ${platform}`);
        }

        const platformConfig = this.platforms[platform];
        
        switch (platform) {
            case 'tencent':
                return new COS({
                    SecretId: config.secretId,
                    SecretKey: config.secretKey,
                });

            case 'aliyun':
                return new OSS({
                    accessKeyId: config.accessKeyId,
                    accessKeySecret: config.accessKeySecret,
                    region: config.region,
                    bucket: config.bucket
                });

            case 'qiniu':
                const mac = new qiniu.auth.digest.Mac(config.accessKey, config.secretKey);
                return {
                    mac,
                    config: {
                        accessKey: config.accessKey,
                        secretKey: config.secretKey,
                        region: config.region,
                        bucket: config.bucket
                    }
                };

            case 'aws':
                AWS.config.update({
                    accessKeyId: config.accessKeyId,
                    secretAccessKey: config.secretAccessKey,
                    region: config.region
                });
                return new AWS.S3();

            case 'huawei':
                // 华为云需要单独实现，这里返回配置
                return {
                    accessKey: config.accessKey,
                    secretKey: config.secretKey,
                    region: config.region,
                    bucket: config.bucket,
                    endpoint: this.getEndpoint(platform, config.region)
                };

            default:
                throw new Error(`不支持的OSS平台: ${platform}`);
        }
    }

    // 获取端点URL
    getEndpoint(platform, region) {
        const platformConfig = this.platforms[platform];
        if (!platformConfig) {
            throw new Error(`不支持的OSS平台: ${platform}`);
        }
        return platformConfig.endpointFormat.replace('{region}', region);
    }

    // 上传文件
    async uploadFile(platform, config, filePath, key) {
        const instance = this.createPlatformInstance(platform, config);
        
        switch (platform) {
            case 'tencent':
                return this.uploadToTencent(instance, config, filePath, key);
            case 'aliyun':
                return this.uploadToAliyun(instance, filePath, key);
            case 'qiniu':
                return this.uploadToQiniu(instance, config, filePath, key);
            case 'aws':
                return this.uploadToAWS(instance, config, filePath, key);
            case 'huawei':
                return this.uploadToHuawei(instance, filePath, key);
            default:
                throw new Error(`不支持的OSS平台: ${platform}`);
        }
    }

    // 腾讯云COS上传
    async uploadToTencent(cos, config, filePath, key) {
        return new Promise((resolve, reject) => {
            cos.putObject({
                Bucket: config.bucket,
                Region: config.region,
                Key: key,
                Body: require('fs').createReadStream(filePath),
            }, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    // 阿里云OSS上传
    async uploadToAliyun(oss, filePath, key) {
        return await oss.put(key, filePath);
    }

    // 七牛云上传
    async uploadToQiniu(instance, config, filePath, key) {
        const putPolicy = new qiniu.rs.PutPolicy({
            scope: config.bucket
        });
        const uploadToken = putPolicy.uploadToken(instance.mac);
        
        const formUploader = new qiniu.form_up.FormUploader();
        const putExtra = new qiniu.form_up.PutExtra();
        
        return new Promise((resolve, reject) => {
            formUploader.putFile(uploadToken, key, filePath, putExtra, (err, body, info) => {
                if (err) reject(err);
                else resolve({ body, info });
            });
        });
    }

    // AWS S3上传
    async uploadToAWS(s3, config, filePath, key) {
        const params = {
            Bucket: config.bucket,
            Key: key,
            Body: require('fs').createReadStream(filePath)
        };
        return await s3.upload(params).promise();
    }

    // 华为云OBS上传（需要实现）
    async uploadToHuawei(instance, filePath, key) {
        // 华为云OBS需要单独实现HTTP请求
        // 这里返回一个占位符
        throw new Error('华为云OBS上传功能待实现');
    }

    // 删除文件
    async deleteFile(platform, config, key) {
        const instance = this.createPlatformInstance(platform, config);
        
        switch (platform) {
            case 'tencent':
                return this.deleteFromTencent(instance, config, key);
            case 'aliyun':
                return this.deleteFromAliyun(instance, key);
            case 'qiniu':
                return this.deleteFromQiniu(instance, config, key);
            case 'aws':
                return this.deleteFromAWS(instance, config, key);
            case 'huawei':
                return this.deleteFromHuawei(instance, key);
            default:
                throw new Error(`不支持的OSS平台: ${platform}`);
        }
    }

    // 腾讯云删除
    async deleteFromTencent(cos, config, key) {
        return new Promise((resolve, reject) => {
            cos.deleteObject({
                Bucket: config.bucket,
                Region: config.region,
                Key: key,
            }, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    // 阿里云删除
    async deleteFromAliyun(oss, key) {
        return await oss.delete(key);
    }

    // 七牛云删除
    async deleteFromQiniu(instance, config, key) {
        const bucketManager = new qiniu.rs.BucketManager(instance.mac);
        return new Promise((resolve, reject) => {
            bucketManager.delete(config.bucket, key, (err, body, info) => {
                if (err) reject(err);
                else resolve({ body, info });
            });
        });
    }

    // AWS删除
    async deleteFromAWS(s3, config, key) {
        const params = {
            Bucket: config.bucket,
            Key: key
        };
        return await s3.deleteObject(params).promise();
    }

    // 华为云删除
    async deleteFromHuawei(instance, key) {
        throw new Error('华为云OBS删除功能待实现');
    }

    // 生成预签名URL
    getSignedUrl(platform, config, key, expires = 3600) {
        const instance = this.createPlatformInstance(platform, config);
        
        switch (platform) {
            case 'tencent':
                return instance.getObjectUrl({
                    Bucket: config.bucket,
                    Region: config.region,
                    Key: key,
                    Sign: true,
                    Expires: expires,
                });
            case 'aliyun':
                return instance.signatureUrl(key, { expires });
            case 'qiniu':
                const mac = instance.mac;
                const domain = this.getEndpoint(platform, config.region);
                const deadline = Math.floor(Date.now() / 1000) + expires;
                const downloadUrl = `${domain}/${key}?e=${deadline}`;
                const encodedSign = qiniu.util.base64ToUrlSafe(
                    qiniu.util.hmacSha1(downloadUrl, mac.secretKey)
                );
                return `${downloadUrl}&token=${mac.accessKey}:${encodedSign}`;
            case 'aws':
                return instance.getSignedUrl('getObject', {
                    Bucket: config.bucket,
                    Key: key,
                    Expires: expires
                });
            case 'huawei':
                throw new Error('华为云OBS预签名URL功能待实现');
            default:
                throw new Error(`不支持的OSS平台: ${platform}`);
        }
    }

    // 测试连接
    async testConnection(platform, config) {
        try {
            const instance = this.createPlatformInstance(platform, config);
            
            switch (platform) {
                case 'tencent':
                    return this.testTencentConnection(instance, config);
                case 'aliyun':
                    return this.testAliyunConnection(instance);
                case 'qiniu':
                    return this.testQiniuConnection(instance, config);
                case 'aws':
                    return this.testAWSConnection(instance, config);
                case 'huawei':
                    return this.testHuaweiConnection(instance);
                default:
                    return false;
            }
        } catch (error) {
            console.error(`${platform}连接测试失败:`, error);
            return false;
        }
    }

    // 腾讯云连接测试
    async testTencentConnection(cos, config) {
        return new Promise((resolve) => {
            cos.getBucket({
                Bucket: config.bucket,
                Region: config.region,
                MaxKeys: 1
            }, (err) => {
                resolve(!err);
            });
        });
    }

    // 阿里云连接测试
    async testAliyunConnection(oss) {
        try {
            await oss.getBucketInfo();
            return true;
        } catch (error) {
            return false;
        }
    }

    // 七牛云连接测试
    async testQiniuConnection(instance, config) {
        try {
            const bucketManager = new qiniu.rs.BucketManager(instance.mac);
            return new Promise((resolve) => {
                bucketManager.getBucketInfo(config.bucket, (err) => {
                    resolve(!err);
                });
            });
        } catch (error) {
            return false;
        }
    }

    // AWS连接测试
    async testAWSConnection(s3, config) {
        try {
            await s3.headBucket({ Bucket: config.bucket }).promise();
            return true;
        } catch (error) {
            return false;
        }
    }

    // 华为云连接测试
    async testHuaweiConnection(instance) {
        // 华为云OBS需要实现HTTP请求测试
        return false;
    }
}

module.exports = new MultiOssService();
