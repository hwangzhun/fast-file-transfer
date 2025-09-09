const db = require('../config/database');

async function addSystemSettingsTable() {
    try {
        console.log('开始创建系统设置表...');
        
        // 创建系统设置表
        const createTableSql = `
            CREATE TABLE IF NOT EXISTS system_settings (
                id INTEGER PRIMARY KEY DEFAULT 1,
                upload_location TEXT DEFAULT 'local',
                max_file_size INTEGER DEFAULT 100,
                file_expire_days INTEGER DEFAULT 7,
                upload_limit INTEGER DEFAULT 10,
                download_limit INTEGER DEFAULT 20,
                oss_config TEXT,
                updated_time DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        await db.run(createTableSql);
        console.log('系统设置表创建成功');
        
        // 插入默认设置
        const insertDefaultSql = `
            INSERT OR IGNORE INTO system_settings 
            (id, upload_location, max_file_size, file_expire_days, upload_limit, download_limit)
            VALUES (1, 'local', 100, 7, 10, 20)
        `;
        
        await db.run(insertDefaultSql);
        console.log('默认系统设置插入成功');
        
        console.log('系统设置表初始化完成');
        
    } catch (error) {
        console.error('创建系统设置表失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    addSystemSettingsTable()
        .then(() => {
            console.log('数据库迁移完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('数据库迁移失败:', error);
            process.exit(1);
        });
}

module.exports = addSystemSettingsTable;
