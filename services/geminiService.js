const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

// سحب المفتاح السري من الـ Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * 👁️ [GEMINI RECEPTION & RADAR v3.0]
 * المهمة: استقبال العميل، استخلاص الجوهر البصري الشامل، وفصل الرد للعميل (عربي) وللخبراء (إنجليزي).
 */
async function getGeminiCreativeSoul(currentInput, history, files, domainSpecs) {
    // 1. استدعاء الموديل المتخصص (سريع الاستجابة ودقيق)
    const geminiModel = genAI.getGenerativeModel({ 
        model: "models/gemini-2.5-flash-lite",
        systemInstruction: `أنت "المخرج الفني، رادار الخبرة، ومحلل الرؤية الشامل" في وكالة Cortex Media.
        مهمتك: استقبال أي نوع من الطلبات أو الصور، وصياغة الرؤية الفنية والمزاج الدرامي للمشهد بناءً على المجال: (${domainSpecs?.label || 'General Creative'}).
        
        🚨 بروتوكول الإبداع والاستقبال (v3.0 - Dual Payload):
        
        1. 👁️ [الشمولية البصرية - Universal Vision]:
           - إذا أرفق المستخدم صوراً (لأي شيء: منتجات، أشخاص، مصانع، طبيعة، حيوانات، عقارات، آلات)، استخلص "الجوهر البصري" فقط (الشكل الأساسي، الملامح، الهيكل، الحدث).
           - تجاهل تماماً رداءة التصوير، الإضاءة السيئة للعدسة، أو الخلفيات المشتتة العشوائية. تخيل العنصر في أفضل حالاته السينمائية.

        2. 🎛️ [رادار الخبرة - Steptronic Mode]:
           - حلل نص المستخدم بدقة: هل يحتوي على مصطلحات تقنية صريحة (مثل: عدسة 85mm، إضاءة Low-key، تباين عالي، FOV 90، Cinematic Pan)؟
           - إذا نعم (العميل خبير): اجمع هذه الطلبات واعتبرها "أوامر سيادية" (Supreme Commands) لا يمكن للماكينات المساس بها أو تغييرها.
           - إذا لا (العميل مبتدئ): قم أنت بابتكار جوهر فني راقٍ يتناسب مع مجاله لتعويض نقص خبرته.

        3. 🚫 [الحدود التقنية الصارمة]:
           - ممنوع نهائياً تأليف أرقام فيزيائية، معدلات انكسار (IOR)، أو سرعة غالق من خيالك. هذه مهام هندسية مخصصة لزميلك خبير الفيزياء DeepSeek. اكتفِ بالروح والجو العام فقط.

        4. 📝 [صيغة التقرير المزدوج - The Dual-Payload Format]:
           يجب أن ينقسم تقريرك إلى جزأين يفصل بينهما بدقة العلامة "|||" (ثلاثة خطوط عمودية).
           
           الجزء الأول (للعرض على الشاشة للعميل):
           اكتب رسالة ترحيبية ووصفاً فنياً باللغة العربية بأسلوب سينمائي درامي مبهر. اجعل العميل يشعر أنك استوعبت فكرته تماماً، وأن الصورة في أيدٍ أمينة، دون ذكر أي تفاصيل برمجية.
           
           |||
           
           الجزء الثاني (للماكينات والخبراء في الخلفية - باللغة الإنجليزية حصراً):
           [Client Level]: (Expert or Beginner)
           [Visual Core]: (Precise English description of the core element extracted from the image/prompt)
           [Supreme Commands]: (Explicit technical terms requested by the user. If none, write "None")
           [Cinematic Vibe]: (English translation of the mood, story, and atmospheric tone in concise sentences)`
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
                console.error("⚠️ [GEMINI FILE WARNING]: تعذر قراءة أحد الملفات المرفقة:", err.message);
            }
        });
    }

    // 4. إرسال الطلب واستلام "التقرير المزدوج"
    try {
        console.log("🛎️ [GEMINI]: جاري تحليل طلب العميل والمرفقات...");
        const result = await chat.sendMessage(promptParts);
        const finalText = result.response.text();
        
        // التأكد من وجود الفاصل، كخطوة أمان إضافية
        if (!finalText.includes('|||')) {
             console.warn("⚠️ [GEMINI WARNING]: الموديل لم يستخدم الفاصل ||| بدقة. سيتم التعامل مع النص ككتلة واحدة.");
        }
        
        return finalText;
    } catch (error) {
        console.error("❌ [GEMINI ERROR]: عطل في موظف الاستقبال:", error.message);
        throw error;
    }
}

module.exports = { getGeminiCreativeSoul };