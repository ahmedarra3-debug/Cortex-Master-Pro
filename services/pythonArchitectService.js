const { spawn } = require('child_process');
const path = require('path');
const { sanitizeLogPayload } = require('./utils/logSanitizer');

/**
 * 🐍 [PYTHON ARCHITECT BRIDGE v3.1]
 * المصلح: تم توجيه المسار يدوياً لنسخة Python 3.13 لضمان التشغيل على ويندوز.
 */
async function getPythonBlueprint(uiSelections, domainSpecs) {
    return new Promise((resolve, reject) => {
        console.log("🐍 [BRIDGE]: جاري فتح قناة اتصال مباشرة مع محرك البايثون...");

        // 1. مسار محرك البايثون من بيئة التشغيل (قابل للنقل بين الأجهزة)
        const pythonExecutable = process.env.PYTHON_PATH || 'python';

        // 2. تحديد مسار ملف السكريبت (architect.py)
        const pythonScriptPath = path.join(__dirname, '../architect.py');

        // 3. تجهيز بيانات الدخول (التقرير والخيارات)
        const inputData = JSON.stringify({
            selections: uiSelections || {},
            domain: domainSpecs || {}
        });

        // 4. إطلاق المحرك بالمسار المباشر (The Direct Launch)
        const pythonProcess = spawn(pythonExecutable, [pythonScriptPath, inputData]);
        const timeoutMs = Number(process.env.PYTHON_BRIDGE_TIMEOUT_MS || 30000);

        let blueprintData = '';
        let errorData = '';
        let settled = false;

        const settleReject = (message) => {
            if (settled) return;
            settled = true;
            reject(new Error(message));
        };

        const settleResolve = (value) => {
            if (settled) return;
            settled = true;
            resolve(value);
        };

        const bridgeTimeout = setTimeout(() => {
            try {
                pythonProcess.kill();
            } catch (_) {}
            settleReject(`انتهت مهلة جسر البايثون بعد ${timeoutMs}ms.`);
        }, timeoutMs);

        // استلام الـ Blueprint من بايثون
        pythonProcess.stdout.on('data', (data) => {
            blueprintData += data.toString();
        });

        // التقاط أي أخطاء فنية
        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        // أخطاء التشغيل (ملف غير موجود، صلاحيات، مسار غير صحيح...)
        pythonProcess.on('error', (error) => {
            clearTimeout(bridgeTimeout);
            console.error("❌ [PYTHON BRIDGE ERROR]:", sanitizeLogPayload(error.message || "Unknown bridge error"));
            settleReject(`تعذر تشغيل محرك البايثون. تحقق من PYTHON_PATH. (${error.message})`);
        });

        // عند انتهاء عملية المعالجة
        pythonProcess.on('close', (code) => {
            clearTimeout(bridgeTimeout);
            if (code !== 0) {
                const safeErrorData = sanitizeLogPayload(errorData || "Unknown python process error");
                console.error(`❌ [PYTHON ERROR]: فشل المحرك بكود ${code}: ${safeErrorData}`);
                return settleReject("فشل محرك البايثون في استخراج القواعد الهندسية.");
            }

            try {
                // إرجاع النتيجة النهائية للـ Board
                settleResolve(blueprintData.trim());
            } catch (e) {
                settleReject("خطأ في قراءة بيانات البايثون المرتجعة.");
            }
        });
    });
}

module.exports = { getPythonBlueprint };