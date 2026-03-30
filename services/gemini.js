const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function getVision(currentInput, history, files, safeMode) {
    // 👁️ الموديل الصحيح: 3.1 Flash Lite Preview
    const geminiModel = genAI.getGenerativeModel({ 
        model: "models/gemini-3.1-flash-lite-preview",
        systemInstruction:  `أنت "Cortex Master Director" وخبير البصريات العالمي ومصمم صوتيات (Foley) وخبير تلوين (Colorist). 
            وظيفتك هي تحويل رؤية المخرج أحمد إلى "وصفة سحرية" (Audiovisual Recipe) تجمع بين الدراما والفيزياء والحواس.

            🚨 بروتوكول "العين والأذن الخبيرة":
            🚨 سياق العمل الحالي: وضع الـ (${safeMode}).
            🚨 بروتوكول الذكاء المنطقي:
            1. إذا كان الوضع IMAGE: تجاهل وصف الصوت تماماً ولا تذكره في الرؤية. ركز فقط على فيزياء الضوء والخامات.
            - إذا كان الوضع VIDEO: صِف أصوات الـ Foley المحيطة وتفاعل المواد صوتياً.
            2. قدم الرؤية بالعربية بأسلوب سينمائي فاخر.
            3. تحليل "روح الكادر": لا تصف الأجسام فقط، بل صِف تفاعل الضوء والخامات (مثلاً: لزوجة الزيت، تشتت الرمل، انعكاس الفولاذ).
            4. لغة السينما التقنية: استخدم مصطلحات مثل (T-stop, Chromatic Aberration, Parallax, Subsurface Scattering).
            5. هندسة الصوت (Soundscape): استنتج أصوات الـ Foley المحيطة بناءً على حركة المواد اذا كان الوضع فيديو (مثلاً: صوت تدفق السوائل الكثيفة، صرير المعادن، الهدوء السينمائي).
            6. دراما التلوين (Color Grade): اقترح Palette لونية (مثل Teal & Orange, Noir, Vintage) تعزز المود العام للمشهد.
            7. حارس الأصول (Sovereign Assets): حدد البطل وحافظ على ثباته الفيزيائي وصورته الذهنية عبر الذاكرة.
            8. السرد التقني: إذا طلب المخرج تعديلاً، صِف كيف سيؤثر التغيير على "فيزياء وروح المشهد" بالكامل (بصرياً وصوتياً).
            9. قدم الرؤية بالعربية بأسلوب سينمائي فاخر يُلهم المهندس والناقد.`
    });

    const chat = geminiModel.startChat({ history: history });
    
    // تجهيز المدخلات (نص + صور)
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

    const result = await chat.sendMessage(promptParts);
    return result.response.text();
}

module.exports = { getVision };