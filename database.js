const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'cortex.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mode TEXT, 
        domain TEXT,
        preset TEXT,
        motion TEXT,
        concept TEXT,
        vision_ar TEXT,
        prompts_en TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

module.exports = {
    // 1. حفظ مشروع جديد لأول مرة
    saveProject: (data) => {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO projects (mode, domain, preset, motion, concept, vision_ar, prompts_en) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const params = [data.mode, data.domain, data.preset, data.motion || 'none', data.concept, data.vision_ar, data.prompts_en];
            
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this.lastID); // بيرجع رقم الـ ID الجديد
            });
        });
    },

    // 🌟 2. المهارة الجديدة: تحديث مشروع قديم (Update)
    updateProject: (id, vision, prompts) => {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE projects SET vision_ar = ?, prompts_en = ? WHERE id = ?`;
            db.run(sql, [vision, prompts, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    },

    getAllProjects: () => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM projects ORDER BY created_at DESC`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};