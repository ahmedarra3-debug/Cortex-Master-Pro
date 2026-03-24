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

let projectHistory = [];

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
    const mode = data.mode || 'photo';
    const domain = data.domain || 'industrial';
    const preset = data.preset || 'custom';
    const motion = data.motion || 'none';
    const isUpdate = (data.isUpdate === "true");
    const activeId = data.projectId; // استلام رقم المشروع لو موجود

    try {
        const MASTER_INSTRUCTIONS = buildInstructions(mode, domain, preset, motion);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: MASTER_INSTRUCTIONS });

        let currentPrompt = isUpdate ? `تعديل: ${data.userUpdate}` : `مشروع جديد: ${data.concept}`;

        let result;
        if (req.file) {
            const imgBuffer = fs.readFileSync(req.file.path);
            const imgPart = [{ inlineData: { data: imgBuffer.toString("base64"), mimeType: req.file.mimetype } }];
            result = await model.generateContent([currentPrompt, ...imgPart]);
            fs.unlinkSync(req.file.path);
        } else {
            const chat = model.startChat({ history: projectHistory });
            result = await chat.sendMessage(currentPrompt);
        }

        const creativeVision = result.response.text();
        const techRes = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: "Technical Prompt Engineer." }, { role: "user", content: creativeVision }]
        });

        const promptsOutput = techRes.choices[0].message.content;
        const finalReply = creativeVision + "\n" + promptsOutput;

        // 🌟 المنطق الجديد: تحديث أم حفظ جديد؟
        let savedId = activeId;
        if (isUpdate && activeId) {
            await db.updateProject(activeId, creativeVision, promptsOutput);
            console.log(`✅ تم تحديث المشروع رقم ${activeId}`);
        } else if (!isUpdate) {
            savedId = await db.saveProject({
                mode, domain, preset, motion, concept: data.concept,
                vision_ar: creativeVision, prompts_en: promptsOutput
            });
            console.log(`🆕 تم حفظ مشروع جديد برقم ${savedId}`);
        }

        projectHistory.push({ role: "user", parts: [{ text: currentPrompt }] });
        projectHistory.push({ role: "model", parts: [{ text: finalReply }] });

        // نرجع الـ ID للواجهة عشان تفضل فكراه
        res.json({ success: true, reply: finalReply, projectId: savedId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/history', async (req, res) => {
    const projects = await db.getAllProjects();
    res.json({ success: true, projects });
});

app.post('/reset', (req, res) => { projectHistory = []; res.json({ success: true }); });
app.listen(3000, () => console.log("🚀 Cortex Engine v1.4.0 (Sync Memory) Ready"));