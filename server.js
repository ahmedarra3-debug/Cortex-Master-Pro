// ============================================================================
// 📦 1. استيراد المكتبات الأساسية (التروس اللي بتشغل المكنة)
// ============================================================================
const express = require('express'); 
const multer = require('multer'); 
const { GoogleGenerativeAI } = require("@google/generative-ai"); 
const OpenAI = require("openai"); 
const fs = require('fs'); 
require('dotenv').config(); 
const db = require('./database'); 

const app = express(); 

// 📂 إعداد نظام التخزين (Multer)
const storage = multer.diskStorage({
    destination: 'uploads/', 
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname) 
});
const upload = multer({ storage }); 

// 📚 تحميل دساتير العلوم (المخاخ الخارجية)
const imageScience = JSON.parse(fs.readFileSync('domains.json', 'utf8')); 
const videoScience = JSON.parse(fs.readFileSync('cortex_science.json', 'utf8')); 

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json()); 
app.use(express.static('public')); 

// ============================================================================
// 🎬 5. الراوت الرئيسي (Cortex Engine v2.5 - The Visionary Director)
// ============================================================================
app.post('/produce', upload.fields([
    { name: 'refImages', maxCount: 5 }, 
    { name: 'start_frame', maxCount: 1 }, 
    { name: 'end_frame', maxCount: 1 }   
]), async (req, res) => {
    
    const data = req.body; 
    const isUpdate = (data.isUpdate === "true"); 
    const mode = data.mode; 
    let activeId = data.projectId; 
    let selectedDomain = data.domain; 
    const currentInput = isUpdate ? data.userUpdate : data.concept; 

    try {
        // 🧠 1. استعادة الذاكرة الفنية للمشروع من الداتابيز
        let projectSpecificHistory = [];
        let previousTechnicalPrompt = "";

        if (activeId) {
            const logs = await db.getProjectHistory(activeId);
            projectSpecificHistory = logs.map(log => ({
                role: log.role === 'user' ? 'user' : 'model',
                parts: [{ text: log.content }]
            }));
            
            // استخراج آخر برومبت تقني لضمان استمرارية الهندسة
            const lastAiLog = logs.reverse().find(log => log.role === 'ai');
            if (lastAiLog) {
                const match = lastAiLog.content.match(/\[Original Prompt\]:?\s*([\s\S]*?)(?=\n\n🔍|$)/);
                if (match) previousTechnicalPrompt = match[1];
            }
        }

        // 👁️ المرحلة الأولى: "العين البصيرة والمخرج الرؤيوي" (Gemini 3.1)
        const geminiModel = genAI.getGenerativeModel({ 
            model: "models/gemini-3.1-flash-lite-preview",
            systemInstruction: `أنت "Cortex Master Director" وخبير البصريات العالمي. 
            وظيفتك هي تحويل رؤية المخرج أحمد إلى "وصفة سحرية" (Visual Recipe) تجمع بين الدراما والفيزياء.

🚨 بروتوكول "العين الخبيرة":
1. تحليل "روح الكادر": لا تصف الأجسام، بل صِف تفاعل الضوء والخامات (مثلاً: لزوجة الزيت، تشتت الرمل، انعكاس الفولاذ).
2. لغة السينما التقنية: استخدم مصطلحات مثل (T-stop, Chromatic Aberration, Parallax, Subsurface Scattering).
3. حارس الأصول (Sovereign Assets): حدد البطل (سيارة، منتج، كائن) وحافظ على ثباته الفيزيائي بكسلياً عبر الذاكرة.
4. السرد التقني: إذا طلب المخرج تعديلاً، صِف كيف سيؤثر التغيير على "فيزياء المشهد" بالكامل دون أن تفقد الجوهر السابق.
5. قدم الرؤية بالعربية بأسلوب سينمائي فاخر يُلهم المهندس والناقد.`
        });

        // 🔗 تفعيل الشات المعتمد على تاريخ المشروع الفعلي
        const chat = geminiModel.startChat({ history: projectSpecificHistory });
        
        let promptParts = [currentInput]; 
        let tempFiles = [];

        if (req.files) {
            const fields = mode === 'video' ? ['start_frame', 'end_frame'] : ['refImages'];
            fields.forEach(f => {
                if (req.files[f]) {
                    req.files[f].forEach(file => {
                        promptParts.push({
                            inlineData: { data: fs.readFileSync(file.path).toString("base64"), mimeType: file.mimetype }
                        });
                        tempFiles.push(file.path);
                    });
                }
            });
        }

        const geminiResult = await chat.sendMessage(promptParts);
        const creativeVision = geminiResult.response.text(); 

        // 🏗️ المرحلة الثانية: المهندس التنفيذي (GPT-5.4) - "المخ المعماري v2.6"
        const domainSpecs = mode === 'video' ? videoScience.visual_domains[selectedDomain] : imageScience.domains[selectedDomain];
        const modelProfile = videoScience.model_profiles[data.model] || videoScience.model_profiles["Wan_2.1"];

        let architectSystem = `You are 'The Architect' for Cortex v2.6. 
        🚨 MISSION: Convert the Master Director's Vision into a SURGICAL TECHNICAL PROMPT. 
        🚨 STRICT RULE: 100% Technical ENGLISH only. NO FULL SENTENCES. Use Comma-Separated Tags.

        1. DATA SOURCE (The Law):
        - Domain Science: ${JSON.stringify(domainSpecs)}.
        - Previous Architecture: ${previousTechnicalPrompt || "Initial Construction"}.
        - Quality Protocol: ${imageScience.global_quality.specs}.

        2. SURGICAL STRUCTURE (The Golden Order):
        - [CORE SUBJECT]: Focus on materials, weights, high-fidelity textures, Sovereign Assets.
        - [DYNAMIC ACTION]: Physics, velocity, particle behavior, suspension, fluid dynamics.
        - [LIGHTING/ATMOSPHERE]: Optical terms (Rim light, T-stop, Volumetric, Fresnel).
        - [CAMERA PHYSICS]: Locked-off, gimbal, specific mm lens, cinematic parallax.
        - [QUALITY TAGS]: Global illumination, ACES, 8k, ray-tracing.

        🚨 ANTI-NOISE: Delete "a, an, the, is, features, with, showcasing". Focus on RAW TEXTURE AND PHYSICS.`;

        const architectRes = await openai.chat.completions.create({
            model: "gpt-5.4", 
            messages: [{ role: "system", content: architectSystem }, { role: "user", content: creativeVision }]
        });
        const technicalPrompt = architectRes.choices[0].message.content;
        // 👨‍🏫 المرحلة الثالثة: الناقد الاستراتيجي والمراجع (GPT-4o) - "المراجع العالمي v2.6"
        const consultantRes = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: `أنت "الناقد الاستراتيجي وكبير مخرجي VFX" لـ Cortex Media. 
                🚨 مهمتك: مراجعة البرومبت التقني وضمان تطابقه مع "رؤية المدير" وقوانين الفيزياء.

                    1. 📦 [Original Prompt]: اطبع برومبت المهندس داخل Code Block.
                    2. 🔍 [Optical Critique]: انتقد الفيزياء الضوئية (Refraction, Fresnel, Caustics) وحركة الكاميرا. هل يوجد "رغي" (Fluff) يجب حذفه؟
                    3. 🚀 [Cortex Optimized Version]: قدم نسخة "جراحية" مطورة. 
                    ⚠️ شرط إلزامي: اتبع منطق v2.6 (No sentences, Comma-separated tags only). 
                    ⚠️ الترتيب: [Subject], [Action], [Lighting], [Camera], [Quality].
                    4. 🚫 [Negative Prompt]: قائمة "ممنوعات بصرية" دقيقة (مثل: morphing artifacts, jitter, floating pixels, ghosting).
                    5. 🚨 [Strategic Battle]: قارن بين الموديلات في جراجك (${JSON.stringify(videoScience.model_profiles)}) ورشح الأنسب لفيزياء هذا المشهد تحديداً.
                    6. 🎬 [Director's Note]: النصيحة النهائية بالمصرية المهنية القوية.` },
                { role: "user", content: `الرؤية الإبداعية: ${creativeVision}\nالبرومبت الهندسي: ${technicalPrompt}` }
            ]
        });

        const finalReply = creativeVision + "\n\n" + consultantRes.choices[0].message.content;
        // 💾 الأرشفة وحفظ البيانات (حذف الصور في النهاية لضمان المعالجة)
        tempFiles.forEach(path => { if(fs.existsSync(path)) fs.unlinkSync(path); });

        if (!activeId) {
            activeId = await db.saveProject({
                mode: mode, domain: selectedDomain, preset: data.model || "Static_v2", 
                motion: data.motion_scale || 'none', concept: data.concept
            });
        }
        await db.addLog(activeId, 'user', currentInput, null);
        await db.addLog(activeId, 'ai', finalReply, null);

        res.json({ success: true, reply: finalReply, projectId: activeId });

    } catch (error) {
        console.error("❌ عطل في المحرك:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// باقي المسارات (History, Reset) تبقى كما هي في الكود الأصلي
app.listen(3000, () => {
    console.log("--------------------------------------------------");
    console.log("🚀 Cortex Engine v2.5 - The Visionary Director Ready");
    console.log("--------------------------------------------------");
});