const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const fs = require('fs');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// 1. قراءة ملف الخبرات (المخ العالمي)
const domainsData = JSON.parse(fs.readFileSync('domains.json', 'utf8'));

// تهيئة المحركات
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(express.static('public'));

let projectHistory = []; // ذاكرة الجلسة

// دالة لتجهيز التعليمات بناءً على المجال المختار
function buildInstructions(domainKey) {
    const domain = domainsData[domainKey] || domainsData['industrial']; // لو ملقاش مجال، يختار صناعي كاحتياط
    return `أنت المخرج الفني والخبير البصري العالمي. 
    مهمتك الحالية: العمل في مجال [${domain.label}].
    
    توجيهات العمل لهذا المجال:
    ${domain.vision}
    
    الرد المطلوب:
    - وصف إبداعي بالعربي يحترم معايير هذا المجال.
    - برومبت إنجليزي تقني فائق الدقة (Masterpiece Prompt) متوافق مع محركات الصور العالمية.`;
}

app.post('/produce', upload.single('refImage'), async (req, res) => {
    const data = req.body;
    const selectedDomain = data.domain || 'industrial'; // استقبال المجال من الواجهة
    
    try {
        const MASTER_INSTRUCTIONS = buildInstructions(selectedDomain);
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            systemInstruction: MASTER_INSTRUCTIONS 
        });

        const isUpdate = (data.isUpdate === "true"); 
        let currentPrompt = isUpdate ? `تعديل إضافي: ${data.userUpdate}` : `مشروع جديد في مجال ${selectedDomain}: ${JSON.stringify(data)}`;

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

        // المرحلة 2: GPT-4o لإنتاج 3 برومبتات احترافية بناءً على رؤية المخرج
        const techRes = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { 
                    role: "system", 
                    content: `You are a Technical Prompt Engineer. Convert the following vision into 3 high-end technical prompts. 
                    Target Keywords for this domain: ${domainsData[selectedDomain].keywords.join(", ")}.` 
                },
                { role: "user", content: creativeVision }
            ]
        });

        const finalOutput = `--- 🎨 رؤية المخرج (${domainsData[selectedDomain].label}) ---\n${creativeVision}\n\n--- 🚀 الأوامر التقنية المقترحة ---\n${techRes.choices[0].message.content}`;
        
        projectHistory.push({ role: "user", parts: [{ text: currentPrompt }] });
        projectHistory.push({ role: "model", parts: [{ text: finalOutput }] });

        res.json({ success: true, reply: finalOutput });
    } catch (error) {
        console.error("Error in Master Engine:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/reset', (req, res) => { projectHistory = []; res.json({ success: true }); });
app.listen(3000, () => console.log("🚀 Cortex Universal Engine V1.3 Ready"));