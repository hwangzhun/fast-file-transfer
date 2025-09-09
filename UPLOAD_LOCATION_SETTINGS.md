# 上传位置设定功能说明

## 功能概述

管理面板现在支持设置文件上传的存储位置，可以选择本地存储或腾讯云OSS存储。管理员可以根据需要灵活切换存储方式。

## 功能特性

### ✅ 存储位置选择
- **本地存储**: 文件保存在服务器本地磁盘
- **腾讯云OSS**: 文件上传到腾讯云对象存储

### ✅ OSS配置管理
- Secret ID 和 Secret Key 配置
- 地域选择（支持多个地区）
- 存储桶名称设置
- 连接测试功能

### ✅ 系统设置持久化
- 设置保存在数据库中
- 支持实时切换存储方式
- 配置验证和错误提示

## 使用方法

### 1. 访问管理面板
1. 打开 `http://localhost:3000/admin.html`
2. 使用管理员密码登录
3. 点击左侧导航的"系统设置"

### 2. 配置存储位置

#### 本地存储
1. 在"文件存储位置"下拉框中选择"本地存储"
2. 配置其他系统参数
3. 点击"保存设置"

#### 腾讯云OSS存储
1. 在"文件存储位置"下拉框中选择"腾讯云OSS"
2. 填写OSS配置信息：
   - **Secret ID**: 腾讯云API密钥ID
   - **Secret Key**: 腾讯云API密钥Key
   - **地域**: 选择存储桶所在地区
   - **存储桶名称**: 腾讯云COS存储桶名称
3. 点击"测试连接"验证配置是否正确
4. 配置其他系统参数
5. 点击"保存设置"

### 3. 配置参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 文件存储位置 | 选择文件存储方式 | 本地存储 |
| 最大文件大小 | 单文件最大大小(MB) | 100 |
| 文件过期天数 | 文件保存天数 | 7 |
| 上传频率限制 | 每15分钟最大上传次数 | 10 |
| 下载频率限制 | 每分钟最大下载次数 | 20 |

## 技术实现

### 数据库表结构
```sql
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    upload_location TEXT DEFAULT 'local',
    max_file_size INTEGER DEFAULT 100,
    file_expire_days INTEGER DEFAULT 7,
    upload_limit INTEGER DEFAULT 10,
    download_limit INTEGER DEFAULT 20,
    oss_config TEXT,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### API接口
- `GET /api/admin/settings` - 获取系统设置
- `POST /api/admin/settings` - 保存系统设置
- `POST /api/admin/test-oss` - 测试OSS连接

### 文件上传流程
1. 检查当前存储位置设置
2. 如果选择OSS存储：
   - 验证OSS配置
   - 上传文件到腾讯云COS
   - 删除本地临时文件
3. 如果选择本地存储：
   - 保存文件到本地目录
4. 记录文件信息到数据库

## 安全注意事项

1. **API密钥安全**: OSS的Secret Key是敏感信息，请妥善保管
2. **权限控制**: 只有管理员可以修改存储设置
3. **配置验证**: 保存前会验证OSS连接是否正常
4. **错误处理**: OSS上传失败时会自动回退到本地存储

## 故障排除

### OSS连接测试失败
1. 检查Secret ID和Secret Key是否正确
2. 确认存储桶名称是否存在
3. 检查地域选择是否正确
4. 确认网络连接是否正常

### 文件上传失败
1. 检查存储位置设置
2. 验证OSS配置是否正确
3. 查看服务器日志获取详细错误信息
4. 确认存储空间是否充足

## 环境变量配置

在 `.env` 文件中可以设置默认的OSS配置：

```env
# 腾讯云OSS配置（可选，优先使用管理面板设置）
TENCENT_SECRET_ID=your_secret_id
TENCENT_SECRET_KEY=your_secret_key
TENCENT_REGION=ap-beijing
TENCENT_BUCKET=your_bucket_name
```

注意：管理面板中的设置会覆盖环境变量中的配置。
