const OSS = require('ali-oss');
const BaseAdapter = require('./BaseAdapter');

/**
 * 阿里云OSS适配器
 */
class AliyunOSSAdapter extends BaseAdapter {
    constructor(config) {
        super(config);
        this.client = new OSS({
            accessKeyId: config.accessKeyId,
            accessKeySecret: config.accessKeySecret,
            bucket: config.bucket,
            region: config.region,
            secure: true // 使用HTTPS
        });
    }

    async uploadFile(filePath, key) {
        try {
            const result = await this.client.put(key, filePath);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async downloadFile(key, localPath) {
        try {
            const result = await this.client.get(key, localPath);
            return result;
        } catch (error) {
            throw error;
        }
    }

    async deleteFile(key) {
        try {
            const result = await this.client.delete(key);
            return result;
        } catch (error) {
            throw error;
        }
    }

    getSignedUrl(key, expires = 3600) {
        try {
            return this.client.signatureUrl(key, { expires });
        } catch (error) {
            throw error;
        }
    }

    async fileExists(key) {
        try {
            await this.client.head(key);
            return true;
        } catch (error) {
            if (error.status === 404) {
                return false;
            }
            throw error;
        }
    }

    async testConnection(config) {
        try {
            const testClient = new OSS({
                accessKeyId: config.accessKeyId,
                accessKeySecret: config.accessKeySecret,
                bucket: config.bucket,
                region: config.region,
                secure: true
            });
            
            // 尝试列出对象
            const result = await testClient.list({
                'max-keys': 1
            });
            return true;
        } catch (error) {
            console.error('阿里云OSS连接测试失败:', error);
            return false;
        }
    }

    getProviderName() {
        return '阿里云OSS';
    }

    getSupportedRegions() {
        return [
            { value: 'oss-cn-hangzhou', label: '华东1（杭州）' },
            { value: 'oss-cn-shanghai', label: '华东2（上海）' },
            { value: 'oss-cn-qingdao', label: '华北1（青岛）' },
            { value: 'oss-cn-beijing', label: '华北2（北京）' },
            { value: 'oss-cn-zhangjiakou', label: '华北3（张家口）' },
            { value: 'oss-cn-huhehaote', label: '华北5（呼和浩特）' },
            { value: 'oss-cn-wulanchabu', label: '华北6（乌兰察布）' },
            { value: 'oss-cn-shenzhen', label: '华南1（深圳）' },
            { value: 'oss-cn-heyuan', label: '华南2（河源）' },
            { value: 'oss-cn-guangzhou', label: '华南3（广州）' },
            { value: 'oss-cn-chengdu', label: '西南1（成都）' },
            { value: 'oss-cn-hefei', label: '华东1（合肥）' },
            { value: 'oss-cn-nanjing', label: '华东1（南京）' },
            { value: 'oss-cn-fuzhou', label: '华东1（福州）' },
            { value: 'oss-cn-wuhan-lr', label: '华中1（武汉）' },
            { value: 'oss-us-east-1', label: '美国东部1（弗吉尼亚）' },
            { value: 'oss-us-west-1', label: '美国西部1（硅谷）' },
            { value: 'oss-ap-southeast-1', label: '亚太东南1（新加坡）' },
            { value: 'oss-ap-southeast-2', label: '亚太东南2（悉尼）' },
            { value: 'oss-ap-southeast-3', label: '亚太东南3（吉隆坡）' },
            { value: 'oss-ap-southeast-5', label: '亚太东南5（雅加达）' },
            { value: 'oss-ap-southeast-6', label: '亚太东南6（马尼拉）' },
            { value: 'oss-ap-southeast-7', label: '亚太东南7（曼谷）' },
            { value: 'oss-ap-northeast-1', label: '亚太东北1（日本）' },
            { value: 'oss-ap-south-1', label: '亚太南部1（孟买）' },
            { value: 'oss-eu-central-1', label: '欧洲中部1（法兰克福）' },
            { value: 'oss-eu-west-1', label: '欧洲西部1（伦敦）' },
            { value: 'oss-me-east-1', label: '中东东部1（迪拜）' }
        ];
    }

    getRequiredConfig() {
        return ['accessKeyId', 'accessKeySecret', 'bucket', 'region'];
    }
}

module.exports = AliyunOSSAdapter;
