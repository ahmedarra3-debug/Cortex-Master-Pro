const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { sanitizeLogPayload } = require('./utils/logSanitizer');
const { parseDtoResponse } = require('./utils/dtoHandler');

const deepseekSystemTemplate = fs.readFileSync(
    path.join(__dirname, '../prompts/deepseek.system.txt'),
    'utf8'
);
const DEEPSEEK_DTO_DEFAULTS = Object.freeze({
    technicalPrompt: "Physically grounded camera and render settings for stable cinematic output.",
    negativePrompt: "incorrect IOR, impossible shutter-speed blur, unstable noise, plastic-like liquid behavior",
    modelSelection: "deepseek-reasoner"
});

/**
 * 🧪 [DEEPSEEK PHYSICS v3.1] - The Scientific Core (Optimized)
 * المهمة: حساب أدق المعايير الفيزيائية بناءً على أوامر المخرج وقواعد بايثون.
 * التحديث: رفع التايم آوت لـ 120 ثانية لضمان استقرار موديل الـ Reasoner.
 */
async function getDeepSeekPhysics(englishPayload, pythonBlueprint, domainSpecs) {
    console.log("🧬 [DEEPSEEK]: جاري إجراء الحسابات الفيزيائية والمحاكاة (مساحة تفكير موسعة)...");

    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-reasoner", // الموديل العبقري في المنطق
            messages: [
                { 
                    role: "system", 
                    content: deepseekSystemTemplate
                     
                },
                { 
                    role: "user", 
                    content: `
                    DOMAIN: ${domainSpecs?.label || 'General'}
                    
                    [GEMINI PAYLOAD]: 
                    ${englishPayload}
                    
                    [PYTHON BLUEPRINT]: 
                    ${pythonBlueprint}
                    ` 
                }
            ]
        }, {
            headers: { 
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            // 🚀 تم رفع الوقت لـ 120 ثانية (دقيقتين) عشان الموديل يلحق يخلص الـ Reasoning
            timeout: 120000 
        });

        return parseDtoResponse(response.data.choices[0]?.message?.content || "", DEEPSEEK_DTO_DEFAULTS, {
            logger: console,
            warningTag: "DEEPSEEK DTO"
        });
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.error("❌ [DEEPSEEK ERROR]: الموديل استغرق وقتاً طويلاً جداً (Timeout).");
        } else {
            const safeErrorPayload = sanitizeLogPayload(error.response?.data || error.message || "Unknown DeepSeek error");
            console.error("❌ [DEEPSEEK ERROR]:", safeErrorPayload);
        }
        throw error;
    }
}

module.exports = { getDeepSeekPhysics };