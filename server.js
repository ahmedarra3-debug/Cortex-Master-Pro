const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
const fs = require('fs');
require('dotenv').config();
const db = require('./database');

const app = express();
const upload = multer({ dest: 'uploads/' });

// 📚 تحميل القاموس العالمي v2.1.0
const domainsData = JSON.parse(fs.readFileSync('domains.json', 'utf8'));

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(express.static('public'));

// 🧠 ذاكرة الجلسة (نظام الـ 20 عنصر)
let projectHistory = []; 

function manageHistory(role, content) {
    projectHistory.push({ role, parts: [{ text: content }] });
    if (projectHistory.length > 20) projectHistory = projectHistory.slice(-20);
}

// 🛠️ تعليمات "العين البصيرة" - نؤكد على الرؤية العربية هنا
function buildGeminiInstructions(mode) {
    return `أنت "عين" مخرج كورتكس العالمية. حلل الصور الـ 5 المرفقة:
    1. حدد العناصر، الإضاءة، والخامات.
    2. اذكر كود المجال من: [${Object.keys(domainsData.domains).join(', ')}].
    3. صِف الرؤية الإبداعية بـ "اللغة العربية" بأسلوب سينمائي فاخر.
    النمط: [${mode === 'video' ? 'سينما' : 'فوتوغراف'}].`;
}

// 🎬 الراوت الرئيسي
app.post('/produce', upload.array('refImages', 5), async (req, res) => {
    const data = req.body;
    const isUpdate = (data.isUpdate === "true");
    let activeId = data.projectId; 
    const currentInput = isUpdate ? data.userUpdate : data.concept;

    try {
        // 1️⃣ المرحلة الأولى: تحليل العين (Gemini)
        const geminiModel = genAI.getGenerativeModel({ 
            model: "models/gemini-3.1-flash-lite-preview",
            systemInstruction: buildGeminiInstructions(data.mode)
        });

        let geminiResult;
        if (req.files && req.files.length > 0) {
            let promptParts = [currentInput];
            req.files.forEach(file => {
                promptParts.push({
                    inlineData: { data: fs.readFileSync(file.path).toString("base64"), mimeType: file.mimetype }
                });
                fs.unlinkSync(file.path); 
            });
            geminiResult = await geminiModel.generateContent(promptParts);
        } else {
            const chat = geminiModel.startChat({ history: projectHistory });
            geminiResult = await chat.sendMessage(currentInput);
        }

        const creativeVision = geminiResult.response.text();
        
        // اكتشاف المجال
        const detectedDomainKey = Object.keys(domainsData.domains).find(key => {
            const domainNameOnly = key.split('_').slice(1).join('_');
            return creativeVision.toLowerCase().includes(domainNameOnly) || creativeVision.includes(key);
        }) || '12_marketing_social';

        const domainSpecs = domainsData.domains[detectedDomainKey];

        // 2️⃣ المرحلة الثانية: "المهندس" (GPT-5.4) - ⚠️ إجبار اللغة الإنجليزية هنا
        const architectRes = await openai.chat.completions.create({
            model: "gpt-5.4", 
            messages: [
                { 
                    role: "system", 
                    content: `You are 'The Architect'. Your task is to translate the Arabic creative vision into a high-end, technical ENGLISH image prompt.
                    
                    ⚠️ RULES:
                    - The output prompt MUST be in ENGLISH.
                    - Use technical terms for lighting, lenses, and materials.
                    - Specs: ${JSON.stringify(domainSpecs.technical_params)}
                    - Quality: ${domainsData.global_quality.specs}`
                },
                { role: "user", content: creativeVision }
            ]
        });

        const rawTechnicalPrompt = architectRes.choices[0].message.content;

        // 3️⃣ المرحلة الثالثة: "المستشار" (GPT-4o) - ⚠️ تنظيم الرد النهائي
        const consultantRes = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { 
                    role: "system", 
                    content: `أنت المستشار الفني وكبير مراجعي الجودة في Cortex Media. 
                    مهمتك مراجعة البرومبت الإنجليزي وتطويره.
                    
                    ⚠️ التنسيق الإجباري للرد:
                    1. ضع البرومبت الإنجليزي النهائي المطور داخل (Markdown Code Block).
                    2. اكتب (Director's Note: نصيحة فنية قصيرة بالعربية للمخرج أحمد) خارج الكود بلوك.`
                },
                { role: "user", content: `الرؤية: ${creativeVision}\n\nالبرومبت: ${rawTechnicalPrompt}` }
            ]
        });

        const finalReply = creativeVision + "\n\n" + consultantRes.choices[0].message.content;

        // 💾 [إدارة الحفظ الذكي]
        if (!isUpdate || !activeId) {
            activeId = await db.saveProject({
                mode: data.mode, domain: detectedDomainKey, preset: "Universal_v2", 
                motion: data.motion || 'none', concept: data.concept
            });
            console.log("📂 [Cortex DB]: مشروع جديد تم إنشاؤه برقم:", activeId);
        }

        // الحفظ في الأرشيف (Logs) يتم دائماً
        try {
            const imageNames = req.files ? req.files.map(f => f.originalname) : null;
            await db.addLog(activeId, 'user', currentInput, imageNames);
            await db.addLog(activeId, 'ai', finalReply, null);
            console.log("📝 [Cortex DB]: تم تسجيل المحادثة للمشروع:", activeId);
        } catch (dbErr) {
            console.error("⚠️ [Cortex DB Error]: فشل تسجيل اللوج:", dbErr.message);
        }

        manageHistory("user", currentInput);
        manageHistory("model", finalReply);

        res.json({ success: true, reply: finalReply, projectId: activeId });

    } catch (error) {
        console.error("❌ عطل في مجلس العقول:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// مسارات الاسترجاع
app.get('/history', async (req, res) => {
    try {
        const projects = await db.getAllProjects();
        res.json({ success: true, projects });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.get('/project-history/:id', async (req, res) => {
    try {
        const logs = await db.getProjectHistory(req.params.id);
        res.json({ success: true, logs });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/reset', (req, res) => { projectHistory = []; res.json({ success: true }); });

app.listen(3000, () => {
    console.log("--------------------------------------------------");
    console.log("🚀 Cortex Engine v1.6.8 - Ready for Production");
    console.log("--------------------------------------------------");
});