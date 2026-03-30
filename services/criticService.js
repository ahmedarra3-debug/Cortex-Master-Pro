const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 🕵️ وظيفة الناقد الصارم في الإصدار v2.1.0
 * @param {string} userConcept - الطلب الأصلي للمخرج أحمد
 * @param {object} reports - التقارير الثلاثة (Claude, DeepSeek, Gemini)
 * @param {string} masterPrompt - البرومبت الذي أنتجه المهندس (GPT-5)
 * @param {object} modelProfiles - قائمة الموديلات المتاحة للاختيار
 */
async function getCortexAudit(userConcept, reports, masterPrompt, modelProfiles) {
    const auditSystem = `أنت "كبير مفتشي الجودة والـ VFX الاستراتيجي" في Cortex Media.
    🚨 مهمتك: إجراء تدقيق جنائي (Forensic Audit) على البرومبت النهائي لضمان العالمية.

    📋 بروتوكول المراجعة الصارم:
    1. 🔍 [The Audit Check]: قارن البرومبت النهائي بتقارير (الفنان، الفيزيائي، والمبدع). هل أهمل المهندس أي تفصيلة عبقرية؟ هل هناك تعارض منطقي بين الإضاءة والفيزياء؟
    2. ⚙️ [Cortex Master Prompt]: اطبع البرومبت النهائي داخل Code Block بعد إجراء "تحسينات جراحية" لو لزم الأمر (English Tags Only).
    3. 🚫 [Sovereign Negative Prompt]: صغ قائمة ممنوعات تقنية (Technical Tags) تمنع التشوه وتحافظ على هوية المجال.
    4. 📊 [Quality Scorecard]: تقييم (0-10) لكل من: (الواقعية الفيزيائية، الدقة الجمالية، روح البراند، والتناسق المنطقي).
       - تنبيه: قيم "دقة الصوت" فقط إذا كان الطلب فيديو.
    5. 🎯 [Model Selection]: بناءً على المعايير التقنية، اختر أنسب موديل من القائمة (${JSON.stringify(modelProfiles)}) وبرر اختيارك تقنياً.
    6. 🎬 [Director's Note]: الخلاصة النهائية للمخرج أحمد باللهجة المصرية المهنية (بدون مجاملة).`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // القاضي الصارم
            messages: [
                { role: "system", content: auditSystem },
                { 
                    role: "user", 
                    content: `
                    - فكرة المخرج الأصلية: ${userConcept}
                    - تقرير الفنان (Claude): ${reports.visual}
                    - تقرير الفيزيائي (DeepSeek): ${reports.physics}
                    - تقرير الروح (Gemini): ${reports.soul}
                    - البرومبت المنتج (Architect): ${masterPrompt}
                    `
                }
            ],
            temperature: 0.3 // لضمان صرامة الرد وعدم "الهبد"
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("❌ [CRITIC SERVICE ERROR]:", error.message);
        throw error;
    }
}

module.exports = { getCortexAudit };