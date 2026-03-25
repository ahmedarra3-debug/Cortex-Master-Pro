const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const fs = require('fs');
require('dotenv').config();
const db = require('./database');

const app = express();
// 🌟 التعديل لـ v1.5.0: استقبال مصفوفة صور بدل صورة واحدة
const upload = multer({ dest: 'uploads/' });
const domainsData = JSON.parse(fs.readFileSync('domains.json', 'utf8'));

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(express.static('public'));

let projectHistory = []; // الذاكرة المؤقتة للجلسة الحالية

function buildInstructions(mode, domainKey, presetKey, motion) {
    const domain = domainsData[domainKey] || domainsData['industrial'];
    const preset = domain.presets[presetKey] || Object.values(domain.presets)[0];
    
    // 🌟 أضفنا preset.focus هنا عشان جيمناي يفهم "هدف اللقطة"
    let base = `أنت المخرج الفني العالمي. 
    النمط: [${mode === 'video' ? 'سينما' : 'فوتو'}]. 
    المجال: [${domain.label}]. 
    القالب: [${preset.name}]. 
    الرؤية: ${domain.vision} 
    العدسة: ${preset.lens} | الإضاءة: ${preset.light} | التركيز: ${preset.focus}`; 
    
    if(mode === 'video') {
        base += `\nحركة الكاميرا: ${motion}.`;
        base += `\nمهمة إضافية: إذا وجدت صورتين، اعتبر الأولى Start Frame والثانية End Frame واشرح التحول بينهما تقنياً.`;
    } else {
        base += `\nمهمة إضافية: إذا وجدت أكثر من صورة، ادمجهم في كادر واحد، قرر من هو البطل (Hero) بناءً على قواعد التكوين الفني، وابتكر له خلفية إبداعية تليق بالمجال.`;
    }
    
    base += `\nالرد: وصف إبداعي بالعربي + برومبت إنجليزي تقني.`;
    return base;
}

// 🌟 التعديل: استخدام array('refImages') لـ v1.5.0
app.post('/produce', upload.array('refImages', 5), async (req, res) => {
    const data = req.body;
    const isUpdate = (data.isUpdate === "true");
    let activeId = data.projectId; 
    const currentInput = isUpdate ? data.userUpdate : data.concept;

    try {
        const MASTER_INSTRUCTIONS = buildInstructions(data.mode, data.domain, data.preset, data.motion);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: MASTER_INSTRUCTIONS });

        let result;
        // 🌟 منطق v1.5.0: التعامل مع تعدد الصور
        if (req.files && req.files.length > 0) {
            let promptParts = [`تعديل/فكرة: ${currentInput}`];
            req.files.forEach(file => {
                const imgBuffer = fs.readFileSync(file.path);
                promptParts.push({
                    inlineData: { data: imgBuffer.toString("base64"), mimeType: file.mimetype }
                });
                fs.unlinkSync(file.path);
            });
            result = await model.generateContent(promptParts);
        } else {
            // 🌟 الحفاظ على منطق v1.4.1: استخدام الشات في حالة عدم وجود صور
            const chat = model.startChat({ history: projectHistory });
            result = await chat.sendMessage(currentInput);
        }

        const creativeVision = result.response.text();
        // --- التعديل في الجزء الخاص بـ GPT-4o داخل ملف server.js ---
        const techRes = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { 
                    role: "system", 
                    content: `You are the World's Master Prompt Engineer for Midjourney v6 and Stable Diffusion. 
                    Your mission: Transform the visual vision into a Hyper-Realistic Technical Prompt.
            
                    RULES:
                    1. Use Optical Physics: (Subsurface Scattering, Fresnel Effect, Ray-tracing).
                    2. Lens Logic: Always specify high-end lenses (Sigma Art, Arri Alexa, Macro 100mm f/2.8).
                    3. Material Science: Define textures (Roughness, Metallic, Index of Refraction for liquids).
                    4. Lighting: Use professional terms (Volumetric, Global Illumination, Rim lighting).
                    5. Output: Focus on 8k resolution, photorealistic, and Unreal Engine 5.2 render style.
                    6. Composition: Ensure the "Hero Object" is center stage with cinematic depth of field.` 
                },
                { role: "user", content: creativeVision }
            ]
        });

        const promptsOutput = techRes.choices[0].message.content;
        const finalReply = creativeVision + "\n\n" + promptsOutput;

        // 🌟 الحفاظ الكامل على منطق "آلة الزمن" v1.4.1
        if (!isUpdate || !activeId) {
            activeId = await db.saveProject({
                mode: data.mode, domain: data.domain, preset: data.preset, 
                motion: data.motion, concept: data.concept
            });
            console.log(`🆕 تم فتح مشروع جديد برقم: ${activeId}`);
        }

        // تسجيل الحوار (Logs) كما في v1.4.1
        // 🌟 استخراج أسماء الصور المرفوعة لتسجيلها في الأرشيف
        const imageNames = req.files ? req.files.map(f => f.originalname) : null;

        // 1. تسجيل "كلام المخرج" مع قائمة الصور اللي استخدمها
        await db.addLog(activeId, 'user', currentInput, imageNames);

        // 2. تسجيل "رد المكنة" (بدون صور إضافية حالياً)
        await db.addLog(activeId, 'ai', finalReply, null);

        // تحديث التاريخ للجلسة
        projectHistory.push({ role: "user", parts: [{ text: currentInput }] });
        projectHistory.push({ role: "model", parts: [{ text: finalReply }] });

        res.json({ success: true, reply: finalReply, projectId: activeId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// الحفاظ على مسارات الأرشيف التاريخية v1.4.1
app.get('/history', async (req, res) => {
    const projects = await db.getAllProjects();
    res.json({ success: true, projects });
});

app.get('/project-history/:id', async (req, res) => {
    try {
        const logs = await db.getProjectHistory(req.params.id);
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/reset', (req, res) => { projectHistory = []; res.json({ success: true }); });
app.listen(3000, () => console.log("🚀 Cortex Engine v1.5.0 (Composition Mastery) Activated"));