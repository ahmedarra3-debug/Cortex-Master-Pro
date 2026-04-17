const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const { sanitizeLogPayload } = require('./utils/logSanitizer');
const { parseDtoResponse } = require('./utils/dtoHandler');
const { readPromptWithCache } = require('./utils/promptCache');

// سحب المفتاح السري من الـ Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const geminiSystemTemplate = readPromptWithCache(
    path.join(__dirname, '../prompts/gemini.system.txt')
);

const GEMINI_DTO_DEFAULTS = Object.freeze({
    visionArabic: "تم استلام الرؤية وتحليلها.",
    technicalReport: "General technical intent with stable cinematic baseline.",
    visualReport: "Balanced composition with production-ready visual storytelling.",
    materialReport: "Physically plausible material behavior with realistic surface response."
});

/**
 * 👁️ [GEMINI RECEPTION & RADAR v3.0]
 * المهمة: استقبال العميل، استخلاص الجوهر البصري الشامل، وفصل الرد للعميل (عربي) وللخبراء (إنجليزي).
 */
async function getGeminiCreativeSoul(currentInput, history, files, domainSpecs) {
    // 1. استدعاء الموديل المتخصص (سريع الاستجابة ودقيق)
    const geminiModel = genAI.getGenerativeModel({ 
        model: "models/gemini-2.5-flash-lite",
        systemInstruction: `${geminiSystemTemplate}\nDomain Context: ${domainSpecs?.label || 'General Creative'}`
    });

    // 2. تفعيل الذاكرة (لربط سياق المشروع ببعضه)
    const chat = geminiModel.startChat({ history: history });
    
    // 3. المعالجة الآمنة للملفات الشاملة
    let promptParts = [currentInput];
    if (files && files.length > 0) {
        files.forEach(file => {
            try {
                // استخدام Try-Catch لضمان عدم توقف السيرفر إذا كان الملف تالفاً
                const fileData = fs.readFileSync(file.path).toString("base64");
                promptParts.push({
                    inlineData: { 
                        data: fileData, 
                        mimeType: file.mimetype 
                    }
                });
            } catch (err) {
                console.error("⚠️ [GEMINI FILE WARNING]: تعذر قراءة أحد الملفات المرفقة:", sanitizeLogPayload(err.message || "Unknown file warning"));
            }
        });
    }

    // 4. إرسال الطلب واستلام التقرير الهيكلي
    try {
        console.log("🛎️ [GEMINI]: جاري تحليل طلب العميل والمرفقات...");
        const result = await chat.sendMessage(promptParts);
        const finalText = result.response.text();

        return parseDtoResponse(finalText, GEMINI_DTO_DEFAULTS, {
            logger: console,
            warningTag: "GEMINI DTO",
            useRawTextAsFirstField: true
        });
    } catch (error) {
        console.error("❌ [GEMINI ERROR]: عطل في موظف الاستقبال:", sanitizeLogPayload(error.message || "Unknown Gemini error"));
        throw error;
    }
}

module.exports = { getGeminiCreativeSoul };