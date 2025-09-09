const db = require('../config/database');

async function addStorageLocationColumn() {
    try {
        console.log('开始添加存储位置字段...');
        
        // 检查字段是否已存在
        const checkColumnSql = `PRAGMA table_info(files)`;
        const columns = await db.query(checkColumnSql);
        const hasStorageLocation = columns.some(col => col.name === 'storage_location');
        
        if (!hasStorageLocation) {
            // 添加存储位置字段
            const addColumnSql = `ALTER TABLE files ADD COLUMN storage_location TEXT DEFAULT 'local'`;
            await db.run(addColumnSql);
            console.log('存储位置字段添加成功');
        } else {
            console.log('存储位置字段已存在');
        }
        
        console.log('数据库迁移完成');
        
    } catch (error) {
        console.error('添加存储位置字段失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    addStorageLocationColumn()
        .then(() => {
            console.log('数据库迁移完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('数据库迁移失败:', error);
            process.exit(1);
        });
}

module.exports = addStorageLocationColumn;
