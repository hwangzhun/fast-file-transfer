const express = require('express');
const jwt = require('jsonwebtoken');
const fileService = require('../services/fileService');

const router = express.Router();

// 管理员密码（在实际项目中应该从环境变量或配置文件中读取）
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// 认证中间件
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: '未提供认证令牌'
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: '无效的认证令牌'
        });
    }
};

// 管理员登录
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({
                success: false,
                message: '请输入管理员密码'
            });
        }
        
        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({
                success: false,
                message: '密码错误'
            });
        }
        
        // 生成JWT token
        const token = jwt.sign(
            { 
                admin: true, 
                timestamp: Date.now() 
            }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            message: '登录成功',
            token
        });
        
    } catch (error) {
        console.error('管理员登录错误:', error);
        res.status(500).json({
            success: false,
            message: '登录失败'
        });
    }
});

// 验证token
router.post('/verify', authenticateAdmin, (req, res) => {
    res.json({
        success: true,
        message: 'Token有效',
        admin: req.admin
    });
});

// 获取所有文件列表
router.get('/files', authenticateAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const files = await fileService.getAllFiles(parseInt(limit), parseInt(offset));

        res.json({
            success: true,
            data: files,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: files.length
            }
        });

    } catch (error) {
        console.error('获取文件列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取文件列表失败'
        });
    }
});

// 获取文件统计信息
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const { fileId } = req.query;
        
        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: '缺少文件ID参数'
            });
        }

        const stats = await fileService.getFileStats(fileId);
        
        if (!stats) {
            return res.status(404).json({
                success: false,
                message: '文件不存在'
            });
        }

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('获取文件统计错误:', error);
        res.status(500).json({
            success: false,
            message: '获取文件统计失败'
        });
    }
});

// 清理过期文件
router.post('/cleanup', authenticateAdmin, async (req, res) => {
    try {
        const cleanedCount = await fileService.cleanExpiredFiles();
        
        res.json({
            success: true,
            message: `成功清理了 ${cleanedCount} 个过期文件`,
            data: {
                cleanedCount
            }
        });

    } catch (error) {
        console.error('清理过期文件错误:', error);
        res.status(500).json({
            success: false,
            message: '清理过期文件失败'
        });
    }
});

// 获取系统设置
router.get('/settings', authenticateAdmin, async (req, res) => {
    try {
        const settings = await fileService.getSystemSettings();
        
        res.json({
            success: true,
            data: settings
        });

    } catch (error) {
        console.error('获取系统设置错误:', error);
        res.status(500).json({
            success: false,
            message: '获取系统设置失败'
        });
    }
});

// 保存系统设置
router.post('/settings', authenticateAdmin, async (req, res) => {
    try {
        const settings = req.body;
        await fileService.saveSystemSettings(settings);
        
        res.json({
            success: true,
            message: '设置保存成功'
        });

    } catch (error) {
        console.error('保存系统设置错误:', error);
        res.status(500).json({
            success: false,
            message: '保存系统设置失败'
        });
    }
});

// 测试OSS连接
router.post('/test-oss', authenticateAdmin, async (req, res) => {
    try {
        const { platform, ...config } = req.body;
        
        if (!platform || !config) {
            return res.status(400).json({
                success: false,
                message: '请提供完整的OSS配置信息'
            });
        }
        
        const multiOssService = require('../services/multiOssService');
        const testResult = await multiOssService.testConnection(platform, config);
        
        if (testResult) {
            res.json({
                success: true,
                message: 'OSS连接测试成功'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'OSS连接测试失败，请检查配置信息'
            });
        }

    } catch (error) {
        console.error('OSS连接测试错误:', error);
        res.status(500).json({
            success: false,
            message: 'OSS连接测试失败: ' + error.message
        });
    }
});

module.exports = router;
