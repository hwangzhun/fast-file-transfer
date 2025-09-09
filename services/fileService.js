const db = require('../config/database');
const { 
    generateFileId, 
    generateShareCode, 
    generateAccessCode, 
    generateFilePath,
    calculateExpireTime 
} = require('../utils/fileUtils');

class FileService {
    // 保存文件信息到数据库
    async saveFileInfo(fileInfo) {
        const {
            originalName,
            fileSize,
            fileType,
            filePath,
            storageLocation = 'local',
            expireDays = 7
        } = fileInfo;

        const fileId = generateFileId();
        const expireTime = calculateExpireTime(expireDays);

        const sql = `
            INSERT INTO files (file_id, original_name, file_size, file_type, file_path, storage_location, expire_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await db.run(sql, [fileId, originalName, fileSize, fileType, filePath, storageLocation, expireTime]);
        return fileId;
    }

    // 创建分享链接
    async createShareLink(fileId) {
        const shareCode = generateShareCode();
        const accessCode = generateAccessCode();

        const sql = `
            INSERT INTO share_links (file_id, share_code, access_code)
            VALUES (?, ?, ?)
        `;

        await db.run(sql, [fileId, shareCode, accessCode]);
        
        return {
            shareCode,
            accessCode
        };
    }

    // 根据分享码获取文件信息
    async getFileByShareCode(shareCode) {
        const sql = `
            SELECT f.*, sl.access_code, sl.access_count, sl.is_active
            FROM files f
            JOIN share_links sl ON f.file_id = sl.file_id
            WHERE sl.share_code = ? AND sl.is_active = 1 AND f.is_deleted = 0
        `;

        return await db.get(sql, [shareCode]);
    }

    // 验证访问码
    async verifyAccessCode(shareCode, accessCode) {
        const sql = `
            SELECT * FROM share_links 
            WHERE share_code = ? AND access_code = ? AND is_active = 1
        `;

        const result = await db.get(sql, [shareCode, accessCode]);
        return !!result;
    }

    // 记录访问日志
    async logAccess(fileId, shareCode, ipAddress, userAgent) {
        const sql = `
            INSERT INTO access_logs (file_id, share_code, ip_address, user_agent)
            VALUES (?, ?, ?, ?)
        `;

        await db.run(sql, [fileId, shareCode, ipAddress, userAgent]);
    }

    // 更新下载次数
    async updateDownloadCount(fileId, shareCode) {
        // 更新文件下载次数
        await db.run(`
            UPDATE files SET download_count = download_count + 1 
            WHERE file_id = ?
        `, [fileId]);

        // 更新分享链接访问次数
        await db.run(`
            UPDATE share_links 
            SET access_count = access_count + 1, last_access_time = CURRENT_TIMESTAMP
            WHERE file_id = ? AND share_code = ?
        `, [fileId, shareCode]);
    }

    // 获取文件统计信息
    async getFileStats(fileId) {
        const sql = `
            SELECT 
                f.download_count,
                f.upload_time,
                f.expire_time,
                sl.access_count,
                sl.last_access_time
            FROM files f
            LEFT JOIN share_links sl ON f.file_id = sl.file_id
            WHERE f.file_id = ?
        `;

        return await db.get(sql, [fileId]);
    }

    // 清理过期文件
    async cleanExpiredFiles() {
        const sql = `
            UPDATE files 
            SET is_deleted = 1 
            WHERE expire_time < CURRENT_TIMESTAMP AND is_deleted = 0
        `;

        const result = await db.run(sql);
        console.log(`清理了 ${result.changes} 个过期文件`);
        return result.changes;
    }

    // 获取所有文件列表（管理用）
    async getAllFiles(limit = 50, offset = 0) {
        const sql = `
            SELECT 
                f.*,
                sl.share_code,
                sl.access_count,
                sl.created_time as share_created_time
            FROM files f
            LEFT JOIN share_links sl ON f.file_id = sl.file_id
            WHERE f.is_deleted = 0
            ORDER BY f.upload_time DESC
            LIMIT ? OFFSET ?
        `;

        return await db.query(sql, [limit, offset]);
    }

    // 获取系统设置
    async getSystemSettings() {
        const sql = `SELECT * FROM system_settings WHERE id = 1`;
        const result = await db.get(sql);
        
        if (result) {
            return {
                uploadLocation: result.upload_location || 'local',
                ossPlatform: result.oss_platform || 'tencent',
                maxFileSize: result.max_file_size || 100,
                fileExpireDays: result.file_expire_days || 7,
                uploadLimit: result.upload_limit || 10,
                downloadLimit: result.download_limit || 20,
                ossConfig: result.oss_config ? JSON.parse(result.oss_config) : null
            };
        }
        
        // 返回默认设置
        return {
            uploadLocation: 'local',
            ossPlatform: 'tencent',
            maxFileSize: 100,
            fileExpireDays: 7,
            uploadLimit: 10,
            downloadLimit: 20,
            ossConfig: null
        };
    }

    // 保存系统设置
    async saveSystemSettings(settings) {
        const {
            uploadLocation,
            ossPlatform,
            maxFileSize,
            fileExpireDays,
            uploadLimit,
            downloadLimit,
            ossConfig
        } = settings;

        const sql = `
            INSERT OR REPLACE INTO system_settings 
            (id, upload_location, oss_platform, max_file_size, file_expire_days, upload_limit, download_limit, oss_config, updated_time)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        await db.run(sql, [
            uploadLocation,
            ossPlatform || 'tencent',
            maxFileSize,
            fileExpireDays,
            uploadLimit,
            downloadLimit,
            ossConfig ? JSON.stringify(ossConfig) : null
        ]);
    }

    // 获取当前上传位置
    async getCurrentUploadLocation() {
        const settings = await this.getSystemSettings();
        return settings.uploadLocation;
    }
}

module.exports = new FileService();
