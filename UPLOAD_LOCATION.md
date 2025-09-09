# 上传位置设置功能说明

## 功能概述

管理面板现在支持动态设置文件上传位置，管理员可以选择将文件上传到本地存储或腾讯云OSS云存储。

## 功能特性

### ✅ 存储位置选择
- **本地存储**: 文件保存在服务器本地磁盘
- **腾讯云OSS**: 文件上传到腾讯云对象存储

### ✅ 动态切换
- 管理员可以在管理面板中随时切换存储位置
- 新上传的文件将使用当前设置的存储位置
- 已存在的文件不受影响

### ✅ OSS配置管理
- 支持自定义OSS配置（Secret ID、Secret Key、地域、存储桶）
- 提供OSS连接测试功能
- 配置信息安全存储在数据库中

### ✅ 智能回退
- 如果OSS上传失败，自动回退到本地存储
- 确保文件上传的可靠性

## 使用方法

### 1. 访问管理面板
访问 `http://localhost:3000/admin.html` 并使用管理员密码登录

### 2. 进入系统设置
点击左侧导航栏的"系统设置"

### 3. 配置上传位置

#### 选择本地存储
- 在"文件存储位置"下拉框中选择"本地存储"
- 点击"保存设置"

#### 选择腾讯云OSS
1. 在"文件存储位置"下拉框中选择"腾讯云OSS"
2. 填写OSS配置信息：
   - **Secret ID**: 腾讯云API密钥ID
   - **Secret Key**: 腾讯云API密钥Key
   - **地域**: 选择存储桶所在的地域
   - **存储桶名称**: 腾讯云COS存储桶名称
3. 点击"测试连接"验证配置是否正确
4. 测试成功后点击"保存设置"

## 配置说明

### 腾讯云OSS配置

#### 获取API密钥
1. 登录腾讯云控制台
2. 进入"访问管理" > "API密钥管理"
3. 创建或查看API密钥

#### 创建存储桶
1. 进入"对象存储" > "存储桶列表"
2. 创建新的存储桶
3. 记录存储桶名称和地域

#### 地域选择
- 北京: ap-beijing
- 上海: ap-shanghai
- 广州: ap-guangzhou
- 成都: ap-chengdu
- 重庆: ap-chongqing
- 深圳金融: ap-shenzhen-fsi
- 上海金融: ap-shanghai-fsi
- 北京金融: ap-beijing-fsi

## 技术实现

### 数据库结构
```sql
-- 系统设置表
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    upload_location TEXT DEFAULT 'local',
    max_file_size INTEGER DEFAULT 100,
    file_expire_days INTEGER DEFAULT 7,
    upload_limit INTEGER DEFAULT 10,
    download_limit INTEGER DEFAULT 20,
    oss_config TEXT,  -- JSON格式存储OSS配置
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 文件表（添加存储位置字段）
CREATE TABLE files (
    -- ... 其他字段
    storage_location TEXT DEFAULT 'local'  -- 存储位置标识
);
```

### API接口
- `GET /api/admin/settings` - 获取系统设置
- `POST /api/admin/settings` - 保存系统设置
- `POST /api/admin/test-oss` - 测试OSS连接

### 文件处理流程
1. 上传时根据设置选择存储位置
2. 下载时根据文件的storage_location字段选择处理方式
3. 预览时同样支持两种存储方式

## 注意事项

### 安全建议
1. **保护OSS密钥**: 不要将API密钥提交到代码仓库
2. **定期轮换密钥**: 建议定期更换腾讯云API密钥
3. **权限最小化**: 为API密钥设置最小必要权限

### 性能考虑
1. **网络延迟**: OSS上传/下载受网络影响
2. **存储成本**: 云存储会产生费用
3. **带宽限制**: 注意腾讯云的带宽限制

### 数据迁移
- 切换存储位置不会影响已存在的文件
- 如需迁移现有文件，需要手动处理
- 建议在业务低峰期进行配置变更

## 故障排除

### OSS连接失败
1. 检查API密钥是否正确
2. 确认存储桶名称和地域是否匹配
3. 检查网络连接是否正常
4. 验证存储桶权限设置

### 上传失败
1. 检查文件大小是否超过限制
2. 确认存储桶有足够的存储空间
3. 查看服务器日志获取详细错误信息

### 下载失败
1. 确认文件在OSS中是否存在
2. 检查OSS配置是否正确
3. 验证文件是否已过期
