const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const fs = require('fs');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

// تهيئة المحركات
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(express.static('public'));

let projectHistory = []; // ذاكرة الجلسة

const MASTER_INSTRUCTIONS = `أنت المخرج الفني لـ Cortex Media. وظيفتك صياغة 3 سيناريوهات بصرية فاخرة.
المعطيات ستشمل: عدسات، إضاءة، زوايا، حركة، وتكوين هرمي.
يجب أن تكون المخرجات:
1. شرح فني بالعربي لكل سيناريو.
2. برومبت تقني بالإنجليزي لكل سيناريو متوافق تماماً مع Nano Banana 2 و Veo.
3. التركيز على فيزياء المواد، لزوجة السوائل، وانعكاسات المعادن.`;

// --- استبدل دالة الـ produce القديمة بهذا الكود المنضبط ---
app.post('/produce', upload.single('refImage'), async (req, res) => {
    const data = req.body;
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            systemInstruction: MASTER_INSTRUCTIONS 
        });

        // تصحيح: قراءة isUpdate بدقة (لأنها بتيجي من الفرونت-إند كـ String)
        const isUpdate = (data.isUpdate === "true"); 
        let currentPrompt = isUpdate ? `تعديل من أحمد: ${data.userUpdate}` : `مشروع جديد: ${JSON.stringify(data)}`;

        let result;
        if (req.file) {
            const imgBuffer = fs.readFileSync(req.file.path);
            const imgPart = [{ inlineData: { data: imgBuffer.toString("base64"), mimeType: req.file.mimetype } }];
            // في حالة الصورة، بنبعت النص والصورة سوا
            result = await model.generateContent([currentPrompt, ...imgPart]);
            fs.unlinkSync(req.file.path);
        } else {
            // في حالة الشات (التعديل)، بنفتح "جلسة شات" عشان يفتكر اللي فات
            const chat = model.startChat({ history: projectHistory });
            result = await chat.sendMessage(currentPrompt);
        }

        const creativeVision = result.response.text();

        // المرحلة 2: GPT-4o للـ 3 برومبتات (Nano Banana 2 Ready)
        const techRes = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Convert into 3 technical prompts for Nano Banana 2. Focus on Petrojack branding and lab details." },
                { role: "user", content: creativeVision }
            ]
        });

        const finalOutput = `--- 🎨 رؤية المخرج ---\n${creativeVision}\n\n--- 🚀 الأوامر التقنية (3 Scenarios) ---\n${techRes.choices[0].message.content}`;
        
        // حفظ التاريخ في الذاكرة (History)
        projectHistory.push({ role: "user", parts: [{ text: currentPrompt }] });
        projectHistory.push({ role: "model", parts: [{ text: finalOutput }] });

        res.json({ success: true, reply: finalOutput });
    } catch (error) {
        console.error("Error in Master Engine:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/reset', (req, res) => { projectHistory = []; res.json({ success: true }); });
app.listen(3000, () => console.log("🚀 Cortex Engine V5 Ready"));