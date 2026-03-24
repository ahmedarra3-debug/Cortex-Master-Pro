const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const fs = require('fs');
require('dotenv').config();
const db = require('./database');

const app = express();
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
    let base = `أنت المخرج الفني العالمي. النمط: [${mode === 'video' ? 'سينما' : 'فوتو'}]. المجال: [${domain.label}]. القالب: [${preset.name}]. الرؤية: ${domain.vision} | العدسة: ${preset.lens} | الإضاءة: ${preset.light}`;
    if(mode === 'video') base += `\nحركة الكاميرا: ${motion}.`;
    base += `\nالرد: وصف إبداعي بالعربي + برومبت إنجليزي تقني.`;
    return base;
}

app.post('/produce', upload.single('refImage'), async (req, res) => {
    const data = req.body;
    const isUpdate = (data.isUpdate === "true");
    let activeId = data.projectId; 
    const currentInput = isUpdate ? data.userUpdate : data.concept;

    try {
        const MASTER_INSTRUCTIONS = buildInstructions(data.mode, data.domain, data.preset, data.motion);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: MASTER_INSTRUCTIONS });

        let result;
        if (req.file) {
            const imgBuffer = fs.readFileSync(req.file.path);
            const imgPart = [{ inlineData: { data: imgBuffer.toString("base64"), mimeType: req.file.mimetype } }];
            result = await model.generateContent([`تعديل/فكرة: ${currentInput}`, ...imgPart]);
            fs.unlinkSync(req.file.path);
        } else {
            const chat = model.startChat({ history: projectHistory });
            result = await chat.sendMessage(currentInput);
        }

        const creativeVision = result.response.text();
        const techRes = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: "Technical Prompt Engineer." }, { role: "user", content: creativeVision }]
        });

        const promptsOutput = techRes.choices[0].message.content;
        const finalReply = creativeVision + "\n\n" + promptsOutput;

        // 🌟 منطق "آلة الزمن" الجديد في v1.4.1
        if (!isUpdate || !activeId) {
            // 1. إنشاء مشروع جديد في جدول projects
            activeId = await db.saveProject({
                mode: data.mode, domain: data.domain, preset: data.preset, 
                motion: data.motion, concept: data.concept
            });
            console.log(`🆕 تم فتح مشروع جديد برقم: ${activeId}`);
        }

        // 2. تسجيل "كلام المخرج" في سجل المحادثة
        await db.addLog(activeId, 'user', currentInput);
        
        // 3. تسجيل "رد المكنة" في سجل المحادثة
        await db.addLog(activeId, 'ai', finalReply);

        // تحديث الذاكرة المؤقتة للجلسة
        projectHistory.push({ role: "user", parts: [{ text: currentInput }] });
        projectHistory.push({ role: "model", parts: [{ text: finalReply }] });

        res.json({ success: true, reply: finalReply, projectId: activeId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// جلب قائمة المشاريع
app.get('/history', async (req, res) => {
    const projects = await db.getAllProjects();
    res.json({ success: true, projects });
});

// 🌟 مسار جديد: جلب شريط الذكريات الكامل لمشروع معين
app.get('/project-history/:id', async (req, res) => {
    try {
        const logs = await db.getProjectHistory(req.params.id);
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/reset', (req, res) => { projectHistory = []; res.json({ success: true }); });
app.listen(3000, () => console.log("🚀 Cortex Engine v1.4.1 (Time Machine) Activated"));