# 文件快传系统

一个基于 Node.js + Express + SQLite 的快速文件分享系统，支持文件上传、分享链接生成、验证码验证和文件下载功能。

## ✨ 功能特性

- 🚀 **快速上传**: 支持拖拽上传，最大100MB文件
- 🔗 **安全分享**: 生成分享码和验证码双重保护
- 📱 **响应式设计**: 支持PC和移动端访问
- 🗄️ **数据持久化**: 使用SQLite数据库存储文件信息
- ⏰ **自动过期**: 文件7天后自动删除
- 📊 **管理面板**: 提供文件管理和统计功能
- 🛡️ **安全防护**: 文件类型验证、大小限制、频率限制

## 🏗️ 技术栈

### 后端
- **Node.js** - JavaScript运行时
- **Express** - Web应用框架
- **SQLite3** - 轻量级数据库
- **Multer** - 文件上传中间件
- **CORS** - 跨域资源共享
- **Express Rate Limit** - 请求频率限制

### 前端
- **HTML5** - 页面结构
- **CSS3** - 样式设计
- **JavaScript (ES6+)** - 交互逻辑
- **Font Awesome** - 图标库

## 📦 安装部署

### 1. 克隆项目
```bash
git clone <repository-url>
cd fast-file-transfer
```

### 2. 安装依赖
```bash
npm install
```

### 3. 初始化数据库
```bash
npm run init-db
```

### 4. 配置环境变量
复制 `env.example` 为 `.env` 并修改配置：
```bash
cp env.example .env
```

编辑 `.env` 文件：
```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 文件配置
MAX_FILE_SIZE=100MB
FILE_EXPIRE_DAYS=7
UPLOAD_PATH=./uploads

# 数据库配置
DB_PATH=./database/files.db
```

### 5. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 6. 访问应用
- 主页面: http://localhost:3000
- 管理面板: http://localhost:3000/admin.html
- API文档: http://localhost:3000/api/health

## 🚀 使用说明

### 上传文件
1. 访问主页面
2. 拖拽文件到上传区域或点击选择文件
3. 等待上传完成
4. 复制分享码、验证码和分享链接

### 下载文件
1. 在下载区域输入分享码和验证码
2. 点击"获取文件信息"查看文件详情
3. 点击"下载文件"开始下载

### 管理文件
1. 访问管理面板
2. 查看文件列表、统计信息
3. 管理文件、清理过期文件

## 📁 项目结构

```
fast-file-transfer/
├── public/                 # 前端静态文件
│   ├── index.html         # 主页面
│   ├── admin.html         # 管理面板
│   ├── styles.css         # 主页面样式
│   ├── admin.css          # 管理面板样式
│   ├── script.js          # 主页面脚本
│   └── admin.js           # 管理面板脚本
├── config/                # 配置文件
│   └── database.js        # 数据库配置
├── routes/                # 路由文件
│   ├── upload.js          # 上传路由
│   ├── download.js        # 下载路由
│   └── admin.js           # 管理路由
├── services/              # 业务逻辑
│   └── fileService.js     # 文件服务
├── utils/                 # 工具函数
│   └── fileUtils.js       # 文件工具
├── scripts/               # 脚本文件
│   └── init-db.js         # 数据库初始化
├── uploads/               # 上传文件目录
├── database/              # 数据库文件
├── server.js              # 主服务器文件
├── package.json           # 项目配置
├── env.example            # 环境变量示例
└── README.md              # 项目说明
```

## 🔧 API 接口

### 文件上传
```
POST /api/upload
Content-Type: multipart/form-data

参数:
- file: 上传的文件

响应:
{
  "success": true,
  "data": {
    "fileId": "文件ID",
    "shareCode": "分享码",
    "accessCode": "验证码",
    "fileName": "文件名",
    "fileSize": "文件大小",
    "downloadUrl": "下载链接",
    "expireTime": "过期时间"
  }
}
```

### 获取文件信息
```
POST /api/download/info/:shareCode
Content-Type: application/json

参数:
{
  "accessCode": "验证码"
}

响应:
{
  "success": true,
  "data": {
    "fileName": "文件名",
    "fileSize": "文件大小",
    "fileType": "文件类型",
    "uploadTime": "上传时间",
    "expireTime": "过期时间",
    "downloadCount": "下载次数"
  }
}
```

### 下载文件
```
GET /api/download/:shareCode?accessCode=验证码

响应: 文件流
```

### 管理接口
```
GET /api/admin/files          # 获取文件列表
GET /api/admin/stats          # 获取统计信息
POST /api/admin/cleanup       # 清理过期文件
```

## 🛡️ 安全特性

- **文件类型验证**: 只允许上传指定类型的文件
- **文件大小限制**: 最大100MB文件大小限制
- **频率限制**: 防止恶意上传和下载
- **验证码保护**: 双重验证确保文件安全
- **自动过期**: 文件自动删除防止存储滥用

## 🔄 数据流程

1. **上传流程**:
   - 用户选择文件 → 验证文件类型和大小 → 保存到本地 → 生成文件ID → 创建分享链接 → 返回分享信息

2. **下载流程**:
   - 用户输入分享码和验证码 → 验证访问权限 → 检查文件是否存在 → 记录访问日志 → 返回文件流

3. **清理流程**:
   - 定时任务检查过期文件 → 标记为已删除 → 清理本地文件

## 📊 数据库设计

### files 表
- `id`: 主键
- `file_id`: 文件唯一标识
- `original_name`: 原始文件名
- `file_size`: 文件大小
- `file_type`: 文件类型
- `file_path`: 文件存储路径
- `upload_time`: 上传时间
- `expire_time`: 过期时间
- `download_count`: 下载次数
- `is_deleted`: 是否已删除

### share_links 表
- `id`: 主键
- `file_id`: 关联文件ID
- `share_code`: 分享码
- `access_code`: 验证码
- `created_time`: 创建时间
- `last_access_time`: 最后访问时间
- `access_count`: 访问次数
- `is_active`: 是否激活

### access_logs 表
- `id`: 主键
- `file_id`: 文件ID
- `share_code`: 分享码
- `access_time`: 访问时间
- `ip_address`: IP地址
- `user_agent`: 用户代理

## 🚀 部署建议

### 开发环境
```bash
npm run dev
```

### 生产环境
1. 使用 PM2 进程管理
```bash
npm install -g pm2
pm2 start server.js --name "file-transfer"
```

2. 使用 Nginx 反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. 配置 HTTPS
```bash
# 使用 Let's Encrypt
certbot --nginx -d your-domain.com
```

## 🔧 配置说明

### 环境变量
- `PORT`: 服务器端口 (默认: 3000)
- `NODE_ENV`: 运行环境 (development/production)
- `MAX_FILE_SIZE`: 最大文件大小 (默认: 100MB)
- `FILE_EXPIRE_DAYS`: 文件过期天数 (默认: 7)
- `UPLOAD_PATH`: 上传文件路径 (默认: ./uploads)
- `DB_PATH`: 数据库文件路径 (默认: ./database/files.db)

### 文件类型支持
- 图片: jpg, jpeg, png, gif, bmp, webp
- 文档: pdf, doc, docx, xls, xlsx, ppt, pptx
- 文本: txt, md, csv
- 压缩包: zip, rar, 7z, tar, gz
- 视频: mp4, avi, mov, wmv, flv
- 音频: mp3, wav, flac, aac
- 可执行文件: exe, msi, dmg, deb, rpm

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 创建 Pull Request

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**注意**: 这是一个演示项目，生产环境使用前请确保进行充分的安全测试和性能优化。
