const express = require('express');
const path = require('path');
const fs = require('fs');
const fileService = require('../services/fileService');
const ossService = require('../services/ossService');

const router = express.Router();

// 获取文件信息（需要验证码）
router.post('/info/:shareCode', async (req, res) => {
    try {
        const { shareCode } = req.params;
        const { accessCode } = req.body;

        if (!accessCode) {
            return res.status(400).json({
                success: false,
                message: '请输入验证码'
            });
        }

        // 验证访问码
        const isValid = await fileService.verifyAccessCode(shareCode, accessCode);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: '验证码错误'
            });
        }

        // 获取文件信息
        const fileInfo = await fileService.getFileByShareCode(shareCode);
        if (!fileInfo) {
            return res.status(404).json({
                success: false,
                message: '文件不存在或已过期'
            });
        }

        res.json({
            success: true,
            data: {
                fileName: fileInfo.original_name,
                fileSize: fileInfo.file_size,
                fileType: fileInfo.file_type,
                uploadTime: fileInfo.upload_time,
                expireTime: fileInfo.expire_time,
                downloadCount: fileInfo.download_count
            }
        });

    } catch (error) {
        console.error('获取文件信息错误:', error);
        res.status(500).json({
            success: false,
            message: '获取文件信息失败'
        });
    }
});

// 下载文件 - 通过API路径
router.get('/file/:shareCode', async (req, res) => {
    try {
        const { shareCode } = req.params;
        const { accessCode } = req.query;

        if (!accessCode) {
            return res.status(400).json({
                success: false,
                message: '缺少验证码参数'
            });
        }

        // 验证访问码
        const isValid = await fileService.verifyAccessCode(shareCode, accessCode);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: '验证码错误'
            });
        }

        // 获取文件信息
        const fileInfo = await fileService.getFileByShareCode(shareCode);
        if (!fileInfo) {
            return res.status(404).json({
                success: false,
                message: '文件不存在或已过期'
            });
        }

        // 检查文件是否过期
        const now = new Date();
        const expireTime = new Date(fileInfo.expire_time);
        if (now > expireTime) {
            return res.status(410).json({
                success: false,
                message: '文件已过期'
            });
        }

        // 记录访问日志
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        await fileService.logAccess(fileInfo.file_id, shareCode, ipAddress, userAgent);

        // 更新下载次数
        await fileService.updateDownloadCount(fileInfo.file_id, shareCode);

        // 设置响应头
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.original_name)}"`);
        res.setHeader('Content-Type', fileInfo.file_type);
        res.setHeader('Content-Length', fileInfo.file_size);

        // 根据存储位置处理文件下载
        if (fileInfo.storage_location === 'oss') {
            // 从OSS下载文件
            try {
                const settings = await fileService.getSystemSettings();
                if (!settings.ossConfig) {
                    return res.status(500).json({
                        success: false,
                        message: 'OSS配置不存在'
                    });
                }

                const customCos = ossService.createCosInstance(settings.ossConfig);
                
                // 使用流式下载
                customCos.getObject({
                    Bucket: settings.ossConfig.bucket,
                    Region: settings.ossConfig.region,
                    Key: fileInfo.file_path,
                }, (err, data) => {
                    if (err) {
                        console.error('OSS下载失败:', err);
                        if (!res.headersSent) {
                            res.status(500).json({
                                success: false,
                                message: '文件下载失败'
                            });
                        }
                    } else {
                        // 将OSS数据流发送给客户端
                        if (data.Body) {
                            data.Body.pipe(res);
                        }
                    }
                });
            } catch (ossError) {
                console.error('OSS下载异常:', ossError);
                res.status(500).json({
                    success: false,
                    message: '文件下载失败'
                });
            }
        } else {
            // 本地文件下载
            if (!fs.existsSync(fileInfo.file_path)) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在'
                });
            }

            // 发送文件
            const fileStream = fs.createReadStream(fileInfo.file_path);
            fileStream.pipe(res);

            fileStream.on('error', (error) => {
                console.error('文件流错误:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: '文件下载失败'
                    });
                }
            });
        }

    } catch (error) {
        console.error('文件下载错误:', error);
        res.status(500).json({
            success: false,
            message: '文件下载失败'
        });
    }
});

// 预览文件（图片等）
router.get('/preview/:shareCode', async (req, res) => {
    try {
        const { shareCode } = req.params;
        const { accessCode } = req.query;

        if (!accessCode) {
            return res.status(400).json({
                success: false,
                message: '缺少验证码参数'
            });
        }

        // 验证访问码
        const isValid = await fileService.verifyAccessCode(shareCode, accessCode);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: '验证码错误'
            });
        }

        // 获取文件信息
        const fileInfo = await fileService.getFileByShareCode(shareCode);
        if (!fileInfo) {
            return res.status(404).json({
                success: false,
                message: '文件不存在或已过期'
            });
        }

        // 只允许预览图片
        if (!fileInfo.file_type.startsWith('image/')) {
            return res.status(403).json({
                success: false,
                message: '该文件类型不支持预览'
            });
        }

        // 设置响应头
        res.setHeader('Content-Type', fileInfo.file_type);
        res.setHeader('Cache-Control', 'public, max-age=3600');

        // 根据存储位置处理文件预览
        if (fileInfo.storage_location === 'oss') {
            // 从OSS预览文件
            try {
                const settings = await fileService.getSystemSettings();
                if (!settings.ossConfig) {
                    return res.status(500).json({
                        success: false,
                        message: 'OSS配置不存在'
                    });
                }

                const customCos = ossService.createCosInstance(settings.ossConfig);
                
                // 使用流式预览
                customCos.getObject({
                    Bucket: settings.ossConfig.bucket,
                    Region: settings.ossConfig.region,
                    Key: fileInfo.file_path,
                }, (err, data) => {
                    if (err) {
                        console.error('OSS预览失败:', err);
                        if (!res.headersSent) {
                            res.status(500).json({
                                success: false,
                                message: '文件预览失败'
                            });
                        }
                    } else {
                        // 将OSS数据流发送给客户端
                        if (data.Body) {
                            data.Body.pipe(res);
                        }
                    }
                });
            } catch (ossError) {
                console.error('OSS预览异常:', ossError);
                res.status(500).json({
                    success: false,
                    message: '文件预览失败'
                });
            }
        } else {
            // 本地文件预览
            if (!fs.existsSync(fileInfo.file_path)) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在'
                });
            }

            // 发送文件
            const fileStream = fs.createReadStream(fileInfo.file_path);
            fileStream.pipe(res);
        }

    } catch (error) {
        console.error('文件预览错误:', error);
        res.status(500).json({
            success: false,
                message: '文件预览失败'
        });
    }
});

module.exports = router;
