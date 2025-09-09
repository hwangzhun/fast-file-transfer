# 多平台OSS服务兼容性说明

## 概述

本系统现在支持多个主流对象存储服务商，通过统一的适配器架构实现跨平台兼容。不同平台的OSS服务在基本功能上相似，但在配置选项和实现细节上存在差异。

## 支持的OSS服务商

| 服务商 | 服务名称 | 适配器类 | 主要特点 |
|--------|----------|----------|----------|
| **腾讯云** | COS | TencentCOSAdapter | 地域命名如 `ap-beijing` |
| **阿里云** | OSS | AliyunOSSAdapter | 地域命名如 `oss-cn-hangzhou` |
| **华为云** | OBS | HuaweiOBSAdapter | 地域命名如 `cn-north-4` |
| **七牛云** | Kodo | QiniuKodoAdapter | 需要配置域名，地域如 `z0` |

## 配置选项对比

### 通用配置字段

所有OSS服务商都支持以下基本配置：

| 字段名 | 说明 | 腾讯云 | 阿里云 | 华为云 | 七牛云 |
|--------|------|--------|--------|--------|--------|
| `accessKeyId` | 访问密钥ID | SecretId | AccessKeyId | AccessKey | AccessKey |
| `accessKeySecret` | 访问密钥 | SecretKey | AccessKeySecret | SecretKey | SecretKey |
| `bucket` | 存储桶名称 | Bucket | Bucket | Bucket | Bucket |
| `region` | 地域 | Region | Region | Region | Zone |

### 特殊配置字段

| 服务商 | 特殊字段 | 说明 |
|--------|----------|------|
| 七牛云 | `domain` | 自定义域名，必需字段 |

## 地域命名差异

### 腾讯云COS
```javascript
// 地域格式: ap-{地区}-{城市}
'ap-beijing'    // 北京
'ap-shanghai'   // 上海
'ap-guangzhou'  // 广州
'ap-hongkong'   // 香港
'na-siliconvalley' // 硅谷
```

### 阿里云OSS
```javascript
// 地域格式: oss-{地区}-{城市}
'oss-cn-hangzhou'  // 华东1(杭州)
'oss-cn-shanghai'  // 华东2(上海)
'oss-cn-beijing'   // 华北2(北京)
'oss-cn-shenzhen'  // 华南1(深圳)
'oss-us-east-1'    // 美国东部1
```

### 华为云OBS
```javascript
// 地域格式: cn-{地区}-{编号}
'cn-north-4'    // 华北-北京四
'cn-east-3'     // 华东-上海一
'cn-south-1'    // 华南-广州
'ap-southeast-1' // 亚太-新加坡
```

### 七牛云Kodo
```javascript
// 地域格式: 简化的地区代码
'z0'  // 华东
'z1'  // 华北
'z2'  // 华南
'na0' // 北美
'as0' // 东南亚
```

## API接口差异

### 上传文件
```javascript
// 腾讯云COS
cos.putObject({
    Bucket: bucket,
    Region: region,
    Key: key,
    Body: stream
});

// 阿里云OSS
client.put(key, filePath);

// 华为云OBS
obsClient.putObject({
    Bucket: bucket,
    Key: key,
    SourceFile: filePath
});

// 七牛云Kodo
formUploader.putFile(uploadToken, key, filePath, putExtra);
```

### 生成预签名URL
```javascript
// 腾讯云COS
cos.getObjectUrl({ Bucket, Region, Key, Sign: true, Expires: expires });

// 阿里云OSS
client.signatureUrl(key, { expires });

// 华为云OBS
obsClient.createSignedUrlSync({ Method: 'GET', Bucket, Key, Expires: expires });

// 七牛云Kodo
bucketManager.privateDownloadUrl(domain, key, deadline);
```

## 使用示例

### 1. 选择OSS服务商
```javascript
// 在管理面板中选择
const provider = 'aliyun-oss'; // 或 'tencent-cos', 'huawei-obs', 'qiniu-kodo'
```

### 2. 配置信息
```javascript
// 阿里云OSS配置
const config = {
    accessKeyId: 'your-access-key-id',
    accessKeySecret: 'your-access-key-secret',
    bucket: 'your-bucket-name',
    region: 'oss-cn-hangzhou'
};

// 七牛云Kodo配置（需要额外域名）
const config = {
    accessKeyId: 'your-access-key',
    accessKeySecret: 'your-secret-key',
    bucket: 'your-bucket-name',
    region: 'z0',
    domain: 'your-custom-domain.com' // 必需
};
```

### 3. 使用统一接口
```javascript
const multiOSSService = require('./services/MultiOSSService');

// 上传文件
await multiOSSService.uploadFile(provider, config, filePath, key);

// 下载文件
await multiOSSService.downloadFile(provider, config, key, localPath);

// 删除文件
await multiOSSService.deleteFile(provider, config, key);

// 生成预签名URL
const url = multiOSSService.getSignedUrl(provider, config, key, 3600);
```

## 适配器架构

### 基础适配器 (BaseAdapter)
```javascript
class BaseAdapter {
    // 定义所有OSS服务必须实现的标准接口
    async uploadFile(filePath, key) { }
    async downloadFile(key, localPath) { }
    async deleteFile(key) { }
    getSignedUrl(key, expires) { }
    async fileExists(key) { }
    async testConnection(config) { }
    getProviderName() { }
    getSupportedRegions() { }
    getRequiredConfig() { }
    validateConfig(config) { }
}
```

### 具体适配器实现
每个OSS服务商都有对应的适配器类，继承自BaseAdapter并实现具体的方法。

## 错误处理

### 统一错误格式
```javascript
try {
    await multiOSSService.uploadFile(provider, config, filePath, key);
} catch (error) {
    // 统一的错误处理
    console.error('上传失败:', error.message);
}
```

### 平台特定错误
不同平台可能有不同的错误码和错误信息，适配器会统一处理并转换为标准格式。

## 性能考虑

### 连接池
- 腾讯云COS: 支持连接池
- 阿里云OSS: 内置连接管理
- 华为云OBS: 支持连接复用
- 七牛云Kodo: 轻量级实现

### 并发上传
所有适配器都支持并发上传，但建议根据各平台的限制调整并发数。

## 安全建议

1. **密钥管理**: 使用环境变量或密钥管理服务存储敏感信息
2. **权限控制**: 为OSS服务创建最小权限的访问密钥
3. **HTTPS**: 所有通信都使用HTTPS加密
4. **定期轮换**: 定期更换访问密钥

## 故障排除

### 常见问题

1. **地域配置错误**: 检查地域代码是否正确
2. **权限不足**: 确认访问密钥有足够的权限
3. **网络问题**: 检查网络连接和防火墙设置
4. **存储桶不存在**: 确认存储桶名称正确且已创建

### 调试模式
```javascript
// 启用详细日志
process.env.DEBUG = 'oss:*';
```

## 扩展性

### 添加新的OSS服务商
1. 创建新的适配器类继承BaseAdapter
2. 实现所有必需的方法
3. 在MultiOSSService中注册新适配器
4. 更新管理界面添加新选项

这种架构设计确保了系统的可扩展性和维护性，可以轻松添加新的OSS服务商支持。
