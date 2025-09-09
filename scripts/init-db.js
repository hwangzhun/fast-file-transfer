const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 确保数据库目录存在
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'files.db');
const db = new sqlite3.Database(dbPath);

// 创建文件表
db.serialize(() => {
    // 文件信息表
    db.run(`
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id TEXT UNIQUE NOT NULL,
            original_name TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            file_type TEXT NOT NULL,
            file_path TEXT NOT NULL,
            storage_location TEXT DEFAULT 'local',
            upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            expire_time DATETIME NOT NULL,
            download_count INTEGER DEFAULT 0,
            is_deleted BOOLEAN DEFAULT 0
        )
    `);

    // 分享链接表
    db.run(`
        CREATE TABLE IF NOT EXISTS share_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id TEXT NOT NULL,
            share_code TEXT UNIQUE NOT NULL,
            access_code TEXT NOT NULL,
            created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_access_time DATETIME,
            access_count INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY (file_id) REFERENCES files (file_id)
        )
    `);

    // 访问记录表
    db.run(`
        CREATE TABLE IF NOT EXISTS access_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id TEXT NOT NULL,
            share_code TEXT NOT NULL,
            access_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            FOREIGN KEY (file_id) REFERENCES files (file_id)
        )
    `);

    // 系统设置表
    db.run(`
        CREATE TABLE IF NOT EXISTS system_settings (
            id INTEGER PRIMARY KEY DEFAULT 1,
            upload_location TEXT DEFAULT 'local',
            oss_platform TEXT DEFAULT 'tencent',
            max_file_size INTEGER DEFAULT 100,
            file_expire_days INTEGER DEFAULT 7,
            upload_limit INTEGER DEFAULT 10,
            download_limit INTEGER DEFAULT 20,
            oss_config TEXT,
            updated_time DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 插入默认设置
    db.run(`
        INSERT OR IGNORE INTO system_settings (id, upload_location, max_file_size, file_expire_days, upload_limit, download_limit)
        VALUES (1, 'local', 100, 7, 10, 20)
    `);

    console.log('数据库初始化完成！');
    console.log('数据库文件位置:', dbPath);
});

db.close();
