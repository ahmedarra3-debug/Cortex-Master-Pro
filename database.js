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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 🌟 التعديل هنا: إضافة column اسمه image_paths لتخزين مسارات الصور
    db.run(`CREATE TABLE IF NOT EXISTS project_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        role TEXT, 
        content TEXT,
        image_paths TEXT, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id)
    )`);
});

module.exports = {
    saveProject: (data) => {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO projects (mode, domain, preset, motion, concept) VALUES (?, ?, ?, ?, ?)`;
            db.run(sql, [data.mode, data.domain, data.preset, data.motion || 'none', data.concept], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    },

    // 🌟 تحديث دالة addLog لتستقبل الصور أيضاً
    addLog: (projectId, role, content, imagePaths = null) => {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO project_logs (project_id, role, content, image_paths) VALUES (?, ?, ?, ?)`;
            // نحول مصفوفة الصور لنص (JSON) عشان تتسيف في الداتا بيز
            const pathsJson = imagePaths ? JSON.stringify(imagePaths) : null;
            db.run(sql, [projectId, role, content, pathsJson], (err) => {
                if (err) reject(err);
                else resolve();
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
    },

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