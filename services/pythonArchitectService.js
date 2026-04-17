const { spawn } = require('child_process');
const path = require('path');
const { sanitizeLogPayload } = require('./utils/logSanitizer');

/**
 * وظيفة المساعدة: إضافة تأخير (Exponential Backoff)
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * الوظيفة الأساسية لاستدعاء Python (بدون Retry)
 */
async function getPythonBlueprintInternal(uiSelections, domainSpecs) {
    return new Promise((resolve, reject) => {
        console.log("🐍 [BRIDGE]: جاري فتح قناة اتصال مباشرة مع محرك البايثون...");

        // 1. التحقق من حجم البيانات (Input Validation)
        const inputData = JSON.stringify({
            selections: uiSelections || {},
            domain: domainSpecs || {}
        });

        // تحذير إذا كانت البيانات كبيرة جداً (أكثر من 50KB)
        if (inputData.length > 50000) {
            console.warn(`⚠️ [BRIDGE WARNING]: بيانات الدخول كبيرة (${inputData.length} بايت). قد يفشل التشغيل على Windows.`);
        }

        // 2. مسار محرك البايثون من بيئة التشغيل
        const pythonExecutable = process.env.PYTHON_PATH || 'python';

        // 3. تحديد مسار ملف السكريبت (architect.py)
        const pythonScriptPath = path.join(__dirname, '../architect.py');

        // 4. إطلاق المحرك بالمسار المباشر
        const pythonProcess = spawn(pythonExecutable, [pythonScriptPath, inputData]);
        const timeoutMs = Number(process.env.PYTHON_BRIDGE_TIMEOUT_MS || 30000);

        let blueprintData = '';
        let errorData = '';
        let settled = false;

        // 🛠️ إصلاح: دالات Settle بدون race condition
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
                settleReject("فشل محرك البايثون في استخراج القواعد الهندسية.");
                return;
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

/**
 * 🐍 [PYTHON ARCHITECT BRIDGE v4.0.1] - مع Retry Mechanism
 * المهمة: التواصل مع محرك البايثون مع 3 محاولات وتأخير متزايد.
 */
async function getPythonBlueprint(uiSelections, domainSpecs) {
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🐍 [BRIDGE]: محاولة ${attempt} من ${maxRetries}...`);
            const result = await getPythonBlueprintInternal(uiSelections, domainSpecs);
            
            if (attempt > 1) {
                console.log(`✅ [BRIDGE SUCCESS]: نجحت المحاولة ${attempt} بعد ${attempt - 1} فشل.`);
            }
            
            return result;
            
        } catch (error) {
            const errorMessage = error.message || "Unknown error";
            
            // ⚠️ عدم إعادة المحاولة في حالات معينة
            const nonRetryableErrors = [
                'تعذر تشغيل محرك البايثون',
                'PYTHON_PATH',
                'file not found',
                'no such file',
                'invalid JSON',
                'خطأ في قراءة بيانات البايثون'
            ];
            
            const isNonRetryable = nonRetryableErrors.some(msg => errorMessage.includes(msg));
            
            if (isNonRetryable || attempt === maxRetries) {
                console.error(`❌ [BRIDGE FAILED]: ${errorMessage}`);
                throw error;
            }
            
            // Exponential Backoff: 100ms, 400ms, 900ms
            const backoffTime = attempt * attempt * 100;
            console.warn(`⚠️ [BRIDGE RETRY]: فشل المحاولة ${attempt}. إعادة المحاولة بعد ${backoffTime}ms...`);
            
            await sleep(backoffTime);
        }
    }
    
    // هذا السطر لا يجب الوصول إليه، لكنه موجود للسلامة
    throw new Error("فشل جميع محاولات جسر البايثون.");
}

/**
 * 🐍 [PYTHON ARCHITECT BRIDGE - Original without retry]
 * للحفاظ على التوافق مع الكود القديم (إذا كان هناك أي كود يعتمد عليه)
 */
async function getPythonBlueprintLegacy(uiSelections, domainSpecs) {
    return getPythonBlueprintInternal(uiSelections, domainSpecs);
}

module.exports = { 
    getPythonBlueprint,        // النسخة الجديدة مع Retry (الافتراضية)
    getPythonBlueprintLegacy  // النسخة القديمة للحفاظ على التوافق
};