const axios = require('axios');
const path = require('path');
const { sanitizeLogPayload } = require('./utils/logSanitizer');
const { parseDtoResponse } = require('./utils/dtoHandler');
const { readPromptWithCache } = require('./utils/promptCache');

const deepseekSystemTemplate = readPromptWithCache(
    path.join(__dirname, '../prompts/deepseek.system.txt')
);
const DEEPSEEK_DTO_DEFAULTS = Object.freeze({
    technicalPrompt: "Physically grounded camera and render settings for stable cinematic output.",
    negativePrompt: "incorrect IOR, impossible shutter-speed blur, unstable noise, plastic-like liquid behavior",
    modelSelection: "deepseek-chat"
});

/**
 * 🧪 [DEEPSEEK PHYSICS v4.0.1] - The Scientific Core (Optimized)
 * المهمة: حساب أدق المعايير الفيزيائية بناءً على أوامر المخرج وقواعد بايثون.
 * التحديث: استبدال Reasoner بـ Chat مع تايم آوت 30 ثانية لتحسين الأداء.
 */
async function getDeepSeekPhysics(englishPayload, pythonBlueprint, domainSpecs) {
    console.log("🧬 [DEEPSEEK]: جاري إجراء الحسابات الفيزيائية (نسخة Chat السريعة)...");

    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat", // أسرع 10x مع الحفاظ على الجودة الأساسية
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
            // ⚡ تم تخفيض الوقت لـ 30 ثانية لتحسين الأداء والتزامن
            timeout: 30000 
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