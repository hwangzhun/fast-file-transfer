const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./config/database');

// 导入路由
const uploadRoutes = require('./routes/upload');
const downloadRoutes = require('./routes/download');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 限流中间件
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 10, // 限制每个IP 15分钟内最多10次上传
    message: {
        success: false,
        message: '上传请求过于频繁，请稍后再试'
    }
});

const downloadLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1分钟
    max: 20, // 限制每个IP 1分钟内最多20次下载
    message: {
        success: false,
        message: '下载请求过于频繁，请稍后再试'
    }
});

// 路由
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/download', downloadLimiter, downloadRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '服务运行正常',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 根路径 - 返回前端页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 下载页面 - 显示文件信息
app.get('/download/:shareCode', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'download.html'));
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: '文件大小超出限制'
        });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            success: false,
            message: '文件字段名错误'
        });
    }

    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});

// 启动服务器
async function startServer() {
    try {
        // 连接数据库
        await db.connect();
        
        // 启动服务器
        app.listen(PORT, () => {
            console.log(`🚀 文件快传服务已启动`);
            console.log(`📁 服务地址: http://localhost:${PORT}`);
            console.log(`📊 管理面板: http://localhost:${PORT}/admin.html`);
            console.log(`🔧 健康检查: http://localhost:${PORT}/api/health`);
        });

        // 定期清理过期文件（每小时执行一次）
        setInterval(async () => {
            try {
                const fileService = require('./services/fileService');
                await fileService.cleanExpiredFiles();
            } catch (error) {
                console.error('定期清理过期文件失败:', error);
            }
        }, 60 * 60 * 1000); // 1小时

    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务器...');
    db.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('收到SIGINT信号，正在关闭服务器...');
    db.close();
    process.exit(0);
});

startServer();
