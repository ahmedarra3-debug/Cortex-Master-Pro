const { spawn } = require('child_process');
const path = require('path');

/**
 * 🐍 [PYTHON ARCHITECT BRIDGE v3.1]
 * المصلح: تم توجيه المسار يدوياً لنسخة Python 3.13 لضمان التشغيل على ويندوز.
 */
async function getPythonBlueprint(uiSelections, domainSpecs) {
    return new Promise((resolve, reject) => {
        console.log("🐍 [BRIDGE]: جاري فتح قناة اتصال مباشرة مع محرك البايثون (3.13)...");

        // 1. تحديد المسار المطلق لمحرك البايثون (المسار اللي إنت بعته يا مخرج)
        // ملحوظة: استخدمنا الـ Double Backslash (\\) عشان الويندوز يفهم العنوان صح
        const pythonExecutable = "C:\\Users\\Ahmed\\AppData\\Local\\Programs\\Python\\Python313\\python.exe";

        // 2. تحديد مسار ملف السكريبت (architect.py)
        const pythonScriptPath = path.join(__dirname, '../architect.py');

        // 3. تجهيز بيانات الدخول (التقرير والخيارات)
        const inputData = JSON.stringify({
            selections: uiSelections || {},
            domain: domainSpecs || {}
        });

        // 4. إطلاق المحرك بالمسار المباشر (The Direct Launch)
        const pythonProcess = spawn(pythonExecutable, [pythonScriptPath, inputData]);

        let blueprintData = '';
        let errorData = '';

        // استلام الـ Blueprint من بايثون
        pythonProcess.stdout.on('data', (data) => {
            blueprintData += data.toString();
        });

        // التقاط أي أخطاء فنية
        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        // عند انتهاء عملية المعالجة
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`❌ [PYTHON ERROR]: فشل المحرك بكود ${code}: ${errorData}`);
                return reject(new Error("فشل محرك البايثون في استخراج القواعد الهندسية."));
            }

            try {
                // إرجاع النتيجة النهائية للـ Board
                resolve(blueprintData.trim());
            } catch (e) {
                reject(new Error("خطأ في قراءة بيانات البايثون المرتجعة."));
            }
        });
    });
}

module.exports = { getPythonBlueprint };