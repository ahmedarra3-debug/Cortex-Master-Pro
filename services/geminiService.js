const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function getGeminiCreativeSoul(currentInput, history, files, domainSpecs) {
    // 1. استدعاء الموديل بنظام الـ System Instruction المتخصص
    const geminiModel = genAI.getGenerativeModel({ 
        model: "models/gemini-3.1-flash-lite-preview",
        systemInstruction: `أنت "المخرج الإبداعي والروح الملهمة" في Cortex Media.
        مهمتك: صياغة الرؤية الفنية والعمق الدرامي للمشهد بناءً على المجال: (${domainSpecs?.label || 'General Creative'}).
        
        🚨 بروتوكول الإبداع:
        1. ركز على: القصة، الجو النفسي (Vibe)، وتفاعل الحواس (بصري وصوتي للمشهد).
        2. تحليل "روح الكادر": إذا أرفق المخرج صوراً، حللها بعمق فني وربطها بطلب المخرج.
        3. لغة السينما: استخدم مصطلحات (Color Grade, Soundscape, Soul of the Frame).
        4. ممنوع: ذكر أرقام فيزيائية أو معادلات تقنية (مهمة زميلك DeepSeek).
        5. قدم الرؤية بالعربية بأسلوب سينمائي يلهم "المهندس" و "الناقد".`
    });

    // 2. تفعيل الذاكرة (History)
    const chat = geminiModel.startChat({ history: history });
    
    // 3. معالجة الملفات (الصور/الفيديوهات) لو وجدت
    let promptParts = [currentInput];
    if (files && files.length > 0) {
        files.forEach(file => {
            promptParts.push({
                inlineData: { 
                    data: fs.readFileSync(file.path).toString("base64"), 
                    mimeType: file.mimetype 
                }
            });
        });
    }

    // 4. إرسال الطلب واستلام "الروح الإبداعية"
    const result = await chat.sendMessage(promptParts);
    return result.response.text();
}

module.exports = { getGeminiCreativeSoul };