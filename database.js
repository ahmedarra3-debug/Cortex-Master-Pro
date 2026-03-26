const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'cortex.db');
const db = new sqlite3.Database(dbPath);

// Enable Foreign Keys and Initialize Tables
db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON");

    // Table 1: Projects
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mode TEXT, 
        domain TEXT,
        preset TEXT,
        motion TEXT,
        concept TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error("❌ Database Error (Projects Table):", err.message);
        else console.log("✅ Projects Table: Operational");
    });

    // Table 2: Project Logs (Conversation History)
    db.run(`CREATE TABLE IF NOT EXISTS project_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        role TEXT, 
        content TEXT,
        image_paths TEXT, 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) console.error("❌ Database Error (Logs Table):", err.message);
        else console.log("✅ Logs Table: Operational");
    });
});

module.exports = {
    // Save the main project entry
    saveProject: (data) => {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO projects (mode, domain, preset, motion, concept) VALUES (?, ?, ?, ?, ?)`;
            db.run(sql, [data.mode, data.domain, data.preset, data.motion || 'none', data.concept], function(err) {
                if (err) {
                    console.error("❌ Failed to save project:", err.message);
                    reject(err);
                } else {
                    console.log(`📂 Project Created: ID #${this.lastID}`);
                    resolve(this.lastID);
                }
            });
        });
    },

    // Save individual conversation turns (User/AI)
    addLog: (projectId, role, content, imagePaths = null) => {
        return new Promise((resolve, reject) => {
            if (!projectId) {
                console.error("⚠️ Cannot add log: ProjectID is missing!");
                return reject("Missing ProjectID");
            }

            const sql = `INSERT INTO project_logs (project_id, role, content, image_paths) VALUES (?, ?, ?, ?)`;
            const pathsJson = imagePaths ? JSON.stringify(imagePaths) : null;
            
            db.run(sql, [projectId, role, content, pathsJson], (err) => {
                if (err) {
                    console.error(`❌ Failed to log ${role} message for ID #${projectId}:`, err.message);
                    reject(err);
                } else {
                    console.log(`📝 Log Saved: [${role}] for Project #${projectId}`);
                    resolve();
                }
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
                if (err) {
                    console.error(`❌ Error fetching history for ID #${projectId}:`, err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
};