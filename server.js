const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const fs = require('fs');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// 1. تحميل كتالوج الخبرات v1.3.1
const domainsData = JSON.parse(fs.readFileSync('domains.json', 'utf8'));

// تهيئة المحركات
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(express.static('public'));

let projectHistory = [];

// دالة بناء التعليمات بناءً على اختيارات المخرج
function buildInstructions(domainKey, presetKey) {
    const domain = domainsData[domainKey] || domainsData['industrial'];
    const preset = domain.presets[presetKey] || Object.values(domain.presets)[0];

    return `أنت المخرج الفني والخبير البصري العالمي. 
    المهمة الحالية: إنتاج برومبتات لمجال [${domain.label}] باستخدام قالب [${preset.name}].
    
    الرؤية العامة للمجال: ${domain.vision}
    التوجه التقني للقالب:
    - العدسة: ${preset.lens}
    - الإضاءة: ${preset.light}
    - التركيز الفني: ${preset.focus}
    
    الرد المطلوب:
    - وصف إبداعي بالعربي يحترم القالب المختار.
    - برومبت إنجليزي تقني (Ultra-Detailed) يدمج هذه الإعدادات لمحركات الصور.`;
}

app.post('/produce', upload.single('refImage'), async (req, res) => {
    const data = req.body;
    const selectedDomain = data.domain || 'industrial';
    const selectedPreset = data.preset || 'custom';
    
    try {
        const MASTER_INSTRUCTIONS = buildInstructions(selectedDomain, selectedPreset);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            systemInstruction: MASTER_INSTRUCTIONS 
        });

        const isUpdate = (data.isUpdate === "true"); 
        let currentPrompt = isUpdate ? `تعديل: ${data.userUpdate}` : `مشروع ${selectedPreset} في ${selectedDomain}: ${JSON.stringify(data)}`;

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
            messages: [
                { role: "system", content: "You are a Technical Prompt Engineer. Focus on the specific lens and lighting provided in the vision." },
                { role: "user", content: creativeVision }
            ]
        });

        const finalOutput = `--- 🎨 رؤية المخرج (${domainsData[selectedDomain].label} - ${selectedPreset}) ---\n${creativeVision}\n\n--- 🚀 الأوامر التقنية ---\n${techRes.choices[0].message.content}`;
        
        projectHistory.push({ role: "user", parts: [{ text: currentPrompt }] });
        projectHistory.push({ role: "model", parts: [{ text: finalOutput }] });

        res.json({ success: true, reply: finalOutput });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/reset', (req, res) => { projectHistory = []; res.json({ success: true }); });
app.listen(3000, () => console.log("🚀 Cortex Engine v1.3.1 Ready"));