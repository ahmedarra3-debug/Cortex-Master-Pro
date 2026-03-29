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
    // 📡 [الرادار المتأمن]: بيطبع الحالة ومنع الكراش لو المود مش مبعوث
    const safeMode = (mode || 'photo').toUpperCase(); 
    console.log("--------------------------------------------------");
    console.log(`🎬 [REQUEST]: استلام طلب إنتاج جديد...`);
    console.log(`🎯 [MODE]: ${safeMode}`); 
    console.log(`📍 [DOMAIN]: ${selectedDomain || 'auto'}`);
    console.log("--------------------------------------------------");

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
            systemInstruction: `أنت "Cortex Master Director" وخبير البصريات العالمي ومصمم صوتيات (Foley) وخبير تلوين (Colorist). 
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
        const domainSpecs = safeMode === 'VIDEO' ? videoScience.visual_domains[selectedDomain] : imageScience.domains[selectedDomain];
        const modelProfile = videoScience.model_profiles[data.model] || videoScience.model_profiles["Wan_2.1"];

        let architectSystem = `You are 'The Architect' for Cortex v2.0.0. 
        🚨 MISSION: Convert the Master Director's Vision into a SURGICAL AUDIOVISUAL TECHNICAL PROMPT. 
        🚨 STRICT RULE: 100% Technical ENGLISH only. NO FULL SENTENCES. Use Comma-Separated Tags.
        🚨 MISSION: Surgical technical prompt construction for mode: ${safeMode}.
        1. DATA SOURCE (The Law):
        - Domain Science: ${JSON.stringify(domainSpecs)}.
        - Previous Architecture: ${previousTechnicalPrompt || "Initial Construction"}.
        - Quality Protocol: ${imageScience.global_quality.specs}.

        2. SURGICAL STRUCTURE (The Golden Order):
        - [CORE SUBJECT]: Focus on materials, weights, high-fidelity textures, Sovereign Assets.
        - [DYNAMIC ACTION]: If ${safeMode} is PHOTO: frozen physics. If VIDEO: motion dynamics.
        - [COLOR PROFILE]: Cinematic LUTs, specific color grading, color science parameters. // 👈 New
        - [AUDIO CUES]: 🚨 CRITICAL: Include this section ONLY if mode is VIDEO. If mode is IMAGE, DELETE this section completely.
        - [LIGHTING/ATMOSPHERE]: Optical terms (Rim light, T-stop, Volumetric, Fresnel) Tailored to ${safeMode} optics.
        - [CAMERA PHYSICS]: Locked-off, gimbal, specific mm lens, cinematic parallax.
        - [QUALITY TAGS]: Global illumination, ACES, 8k, ray-tracing.

        🚨 ANTI-NOISE: No sentences. Focus on RAW TEXTURE AND PHYSICS.`;
        const architectRes = await openai.chat.completions.create({
            model: "gpt-5.4", 
            messages: [{ role: "system", content: architectSystem }, { role: "user", content: creativeVision }]
        });
        const technicalPrompt = architectRes.choices[0].message.content;
        // 👨‍🏫 المرحلة الثالثة: الناقد الاستراتيجي والمراجع (GPT-4o) - "المراجع العالمي v2.6"
        const consultantRes = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: `أنت "الناقد الاستراتيجي وكبير مخرجي VFX ومهندس جودة" لـ Cortex Media. 
                🚨 مهمتك: مراجعة البرومبت التقني وضمان الكمال البصري (والصوتي في الفيديو فقط) واللوني.

                1. 📦 [Original Prompt]: اطبع برومبت المهندس داخل Code Block.
                2. 🔍 [Audiovisual Critique]: انتقد الفيزياء الضوئية، التلوين، والشمولية الصوتية. هل الكود يخدم "روح المشهد"؟
                3. 🚀 [Cortex Optimized Version]: قدم نسخة "جراحية" مطورة (Tags only) تتبع منطق v2.0.0.
                4. 📊 [Technical Scorecard]: قيّم (0-10) في: (الواقعية، ثبات البكسلات، دراما اللون). 
🚨 تنبيه منطقي: إذا كان الوضع IMAGE، لا تقيّم "دقة الصوت" نهائياً. إذا كان VIDEO، أضف تقييم (دقة الصوت).
                5. 🚫 [Negative Prompt]: قائمة "ممنوعات بصرية وصوتية" دقيقة (مثل: morphing, audio clipping, ghosting).
                6. 🚨 [Strategic Battle]: قارن بين الموديلات في جراجك (${JSON.stringify(videoScience.model_profiles)}) ورشح الأنسب لهذا التكوين.
                7. 🎬 [Director's Note]: النصيحة النهائية بالمصرية المهنية القوية.` },
                { role: "user", content: `الرؤية الإبداعية: ${creativeVision}\nالبرومبت الهندسي: ${technicalPrompt}` }
            ]
        });

        const finalReply = creativeVision + "\n\n" + consultantRes.choices[0].message.content;
        // 💾 الأرشفة وحفظ البيانات (حذف الصور في النهاية لضمان المعالجة)
        tempFiles.forEach(path => { if(fs.existsSync(path)) fs.unlinkSync(path); });

        if (!activeId) {
            activeId = await db.saveProject({
                mode: mode || 'photo', domain: selectedDomain, preset: data.model || "Static_v2", 
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

// ============================================================================
// 📚 مسارات الأرشيف النهائية (Cortex Archive System - Fixed Logic)
// ============================================================================

// 1. جلب قائمة المشاريع (مطابق لطلب الـ index.html)
app.get('/history', async (req, res) => {
    try {
        console.log("📂 [RADAR]: جاري استدعاء قائمة المشاريع للأرشيف...");
        const projects = await db.getAllProjects(); 
        
        // 🚨 التعديل الجوهري: نبعت البيانات جوه كائن اسمه projects
        res.json({ projects: projects }); 
        
        console.log(`✅ [SUCCESS]: تم إرسال ${projects.length} مشروع.`);
    } catch (error) {
        console.error("❌ عطل في جلب المشاريع:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. جلب سجلات مشروع معين (مطابق لطلب الـ index.html)
app.get('/project-history/:id', async (req, res) => {
    const projectId = req.params.id;
    try {
        console.log(`📜 [RADAR]: جاري استعادة سجلات المشروع ID: ${projectId}`);
        const history = await db.getProjectHistory(projectId);
        
        // 🚨 التعديل الجوهري: نبعت البيانات جوه كائن اسمه logs
        res.json({ logs: history });
        
        console.log(`✅ [SUCCESS]: تم تحميل سجلات المشروع بنجاح.`);
    } catch (error) {
        console.error("❌ عطل في جلب السجلات:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. إعادة ضبط (Reset)
app.post('/reset', (req, res) => {
    console.log("🧹 [RADAR]: جاري عمل Reset للمنصة...");
    res.json({ success: true, message: "تمت إعادة الضبط" });
});
app.listen(3000, () => {
    console.log("--------------------------------------------------");
    console.log("🚀 Cortex Engine v2.5 - The Visionary Director Ready");
    console.log("--------------------------------------------------");
});