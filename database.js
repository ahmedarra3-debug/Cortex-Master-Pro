const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'cortex.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. جدول المشاريع (البيانات الأساسية)
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mode TEXT, 
        domain TEXT,
        preset TEXT,
        motion TEXT,
        concept TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 🌟 2. الجدول الجديد: سجل المحادثات (آلة الزمن)
    db.run(`CREATE TABLE IF NOT EXISTS project_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        role TEXT, -- 'user' أو 'ai'
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id)
    )`);
});

module.exports = {
    // حفظ مشروع جديد
    saveProject: (data) => {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO projects (mode, domain, preset, motion, concept) VALUES (?, ?, ?, ?, ?)`;
            db.run(sql, [data.mode, data.domain, data.preset, data.motion || 'none', data.concept], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    // 🌟 إضافة سجل جديد (سواء تعديل من المستخدم أو رد من المكنة)
    addLog: (projectId, role, content) => {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO project_logs (project_id, role, content) VALUES (?, ?, ?)`;
            db.run(sql, [projectId, role, content], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    // جلب قائمة المشاريع للأرشيف
    getAllProjects: () => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM projects ORDER BY created_at DESC`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // 🌟 جلب "كل الشريط التاريخي" لمشروع معين
    getProjectHistory: (projectId) => {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM project_logs WHERE project_id = ? ORDER BY created_at ASC`;
            db.all(sql, [projectId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};