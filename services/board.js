// استيراد الخدمات (الأقسام)
const gemini = require('./gemini');
const architect = require('./architect');
const critic = require('./critic');

async function processProduction(params) {
    const { 
        concept, history, files, safeMode, 
        domainSpecs, previousPrompt, qualitySpecs, modelProfiles 
    } = params;

    console.log("--------------------------------------------------");
    console.log(`🧠 [BOARD]: بدء معالجة الطلب في غرفة العمليات...`);

    try {
        // 👁️ المرحلة الأولى: المخرج الرؤيوي (Gemini 3.1)
        // بياخد: (النص، الذاكرة، الصور، المود)
        const creativeVision = await gemini.getVision(concept, history, files, safeMode);
        console.log("✅ [BOARD]: المخرج انتهى من صياغة الرؤية.");

        // 🏗️ المرحلة الثانية: المهندس التنفيذي (GPT-5.4)
        // بياخد: (الرؤية، مواصفات الدومين، البرومبت القديم، المود، كواليتي)
        const technicalPrompt = await architect.generateTechnicalPrompt(
            creativeVision, domainSpecs, previousPrompt, safeMode, qualitySpecs
        );
        console.log("✅ [BOARD]: المهندس انتهى من التصميم التقني.");

        // 👨‍🏫 المرحلة الثالثة: الناقد الاستراتيجي (GPT-4o)
        // بياخد: (الرؤية، البرومبت الهندسي، بروفايلات الموديلات)
        const critique = await critic.getFinalReview(creativeVision, technicalPrompt, modelProfiles);
        console.log("✅ [BOARD]: الناقد وضع اللمسة النهائية والتقييم.");

        // تجميع النتائج "الزتونة" للعودة بها إلى السيرفر
        return {
            vision: creativeVision,
            technical: technicalPrompt,
            finalReview: critique
        };

    } catch (error) {
        console.error("❌ [BOARD ERROR]:", error.message);
        throw error; // بنرمي الخطأ للسيرفر عشان يتعامل معاه
    }
}

module.exports = { processProduction };