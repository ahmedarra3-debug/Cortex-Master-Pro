const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getFinalReview(creativeVision, technicalPrompt, modelProfiles) {
    const consultantSystem = `أنت "الناقد الاستراتيجي وكبير مخرجي VFX ومهندس جودة" لـ Cortex Media. 
    🚨 مهمتك: مراجعة البرومبت التقني وضمان الكمال البصري (والصوتي في الفيديو فقط) واللوني.
    1. 📦 [Original Prompt]: اطبع برومبت المهندس داخل Code Block.
    2. 🔍 [Audiovisual Critique]: انتقد الفيزياء الضوئية، التلوين، والشمولية الصوتية. هل الكود يخدم "روح المشهد"؟
    3. 🚀 [Cortex Optimized Version]: قدم نسخة "جراحية" مطورة (English Tags only) تتبع منطق v2.0.0.
    4. 📊 [Technical Scorecard]: قيّم (0-10) في: (الواقعية، ثبات البكسلات، دراما اللون). 
       🚨 تنبيه منطقي: إذا كان الوضع IMAGE، لا تقيّم "دقة الصوت" نهائياً. إذا كان VIDEO، أضف تقييم (دقة الصوت).
    5. 🚫 [Negative Prompt]: قائمة "ممنوعات بصرية وصوتية" دقيقة (Technical English Tags ONLY).
    6. 🚨 [Strategic Battle]: قارن بين الموديلات في جراجك (${JSON.stringify(modelProfiles)}) ورشح الأنسب لهذا التكوين.
    7. 🎬 [Director's Note]: النصيحة النهائية بالمصرية المهنية القوية.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: consultantSystem },
                { role: "user", content: `الرؤية الإبداعية: ${creativeVision}\nالبرومبت الهندسي: ${technicalPrompt}` }
            ]
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("❌ [CRITIC ERROR]:", error.message);
        throw error;
    }
}

module.exports = { getFinalReview };