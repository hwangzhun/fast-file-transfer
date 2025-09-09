const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fileService = require('../services/fileService');
const ossService = require('../services/ossService');
const { isAllowedFileType, formatFileSize } = require('../utils/fileUtils');

const router = express.Router();

// 确保上传目录存在
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = path.extname(file.originalname);
        cb(null, `${timestamp}_${randomStr}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    },
    fileFilter: (req, file, cb) => {
        if (isAllowedFileType(file.originalname)) {
            cb(null, true);
        } else {
            cb(new Error('不支持的文件类型'), false);
        }
    }
});

// 文件上传接口
router.post('/', upload.single('file'), async (req, res) => {
    let finalFilePath = null;
    let storageLocation = 'local';
    
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的文件'
            });
        }

        // 获取当前上传位置设置
        const uploadLocation = await fileService.getCurrentUploadLocation();
        const settings = await fileService.getSystemSettings();
        
        if (uploadLocation === 'oss' && settings.ossConfig && settings.ossPlatform) {
            // 上传到OSS
            try {
                const multiOssService = require('../services/multiOssService');
                const ossKey = `uploads/${Date.now()}_${Math.random().toString(36).substring(2, 8)}${path.extname(req.file.originalname)}`;
                
                // 使用多平台OSS服务上传
                await multiOssService.uploadFile(settings.ossPlatform, settings.ossConfig, req.file.path, ossKey);
                
                // 删除本地临时文件
                fs.unlinkSync(req.file.path);
                
                finalFilePath = ossKey;
                storageLocation = 'oss';
                
            } catch (ossError) {
                console.error('OSS上传失败:', ossError);
                // 如果OSS上传失败，回退到本地存储
                finalFilePath = req.file.path;
                storageLocation = 'local';
            }
        } else {
            // 本地存储
            finalFilePath = req.file.path;
            storageLocation = 'local';
        }

        // 保存文件信息到数据库
        const fileId = await fileService.saveFileInfo({
            originalName: req.file.originalname,
            fileSize: req.file.size,
            fileType: req.file.mimetype,
            filePath: finalFilePath,
            storageLocation: storageLocation,
            expireDays: settings.fileExpireDays || 7
        });

        // 创建分享链接
        const { shareCode, accessCode } = await fileService.createShareLink(fileId);

        res.json({
            success: true,
            message: '文件上传成功',
            data: {
                fileId,
                shareCode,
                accessCode,
                fileName: req.file.originalname,
                fileSize: formatFileSize(req.file.size),
                downloadUrl: `/download/${shareCode}`,
                storageLocation: storageLocation,
                expireTime: new Date(Date.now() + (settings.fileExpireDays || 7) * 24 * 60 * 60 * 1000).toISOString()
            }
        });

    } catch (error) {
        console.error('文件上传错误:', error);
        
        // 如果上传失败，删除已上传的文件
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: error.message || '文件上传失败'
        });
    }
});

// 获取上传进度（如果需要的话）
router.get('/progress/:fileId', (req, res) => {
    // 这里可以实现上传进度查询
    res.json({
        success: true,
        progress: 100
    });
});

module.exports = router;
