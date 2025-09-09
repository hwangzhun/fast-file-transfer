const crypto = require('crypto');
const path = require('path');

// 生成唯一文件ID
function generateFileId() {
    return crypto.randomBytes(16).toString('hex');
}

// 生成分享码
function generateShareCode() {
    return crypto.randomBytes(8).toString('hex');
}

// 生成访问验证码
function generateAccessCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 生成文件存储路径
function generateFilePath(originalName) {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(4).toString('hex');
    return `files/${timestamp}_${randomStr}${ext}`;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 检查文件类型是否允许
function isAllowedFileType(filename) {
    const allowedTypes = [
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', // 图片
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', // 文档
        '.txt', '.md', '.csv', // 文本
        '.zip', '.rar', '.7z', '.tar', '.gz', // 压缩包
        '.mp4', '.avi', '.mov', '.wmv', '.flv', // 视频
        '.mp3', '.wav', '.flac', '.aac', // 音频
        '.exe', '.msi', '.dmg', '.deb', '.rpm' // 可执行文件
    ];
    
    const ext = path.extname(filename).toLowerCase();
    return allowedTypes.includes(ext);
}

// 计算过期时间
function calculateExpireTime(days = 7) {
    const now = new Date();
    return new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
}

module.exports = {
    generateFileId,
    generateShareCode,
    generateAccessCode,
    generateFilePath,
    formatFileSize,
    isAllowedFileType,
    calculateExpireTime
};
