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

app.post('/produce', upload.array('refImages', 5), async (req, res) => {
    const data = req.body;
    const isUpdate = (data.isUpdate === "true");
    let activeId = data.projectId; 
    const currentInput = isUpdate ? data.userUpdate : data.concept;

    try {
        const MASTER_INSTRUCTIONS = buildInstructions(data.mode, data.domain, data.preset, data.motion);
        
        // 🌟 تصحيح الموديل: استخدام نسخة مستقرة لضمان عدم حدوث Crash
        const model = genAI.getGenerativeModel({ 
    model: "models/gemini-3.1-flash-lite-preview", 
    systemInstruction: MASTER_INSTRUCTIONS 
});

        let result;
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
            const chat = model.startChat({ history: projectHistory });
            result = await chat.sendMessage(currentInput);
        }

        const creativeVision = result.response.text();
        
        // 🌟 المحرك العالمي لـ OpenAI: يشمل كافة المجالات فيزياءً وفناً
        const techRes = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { 
                    role: "system", 
                    content: `أنت كبير مهندسي الرندر والبرومبت. مهمتك تحويل الرؤية الفنية إلى كود تقني فائق الواقعية (Hyper-Realistic).
            
            قواعد ذهبية لكل المجالات:
            1. الفيزياء البصرية: (Subsurface Scattering) للمحاصيل والجلد، (Ray-tracing) للمعادن، (IOR 1.47) للسوائل.
            2. المواد: حدد ملمس الأسطح بدقة (Roughness, Anisotropic Metal, Organic Textures).
            3. العدسات: (Arri Alexa) للسينما، (Macro 100mm) للطب والتجارة، (Wide-angle) للعقارات.
            4. الإضاءة: (Volumetric Fog) للصناعة، (Golden Hour) للزراعة، (Sterile White) للطب.
            5. الإخراج: ركز على 8k, Unreal Engine 5.4 style, Octane Render.` 
                },
                { role: "user", content: creativeVision }
            ]
        });

        const promptsOutput = techRes.choices[0].message.content;
        const finalReply = creativeVision + "\n\n" + promptsOutput;

        if (!isUpdate || !activeId) {
            activeId = await db.saveProject({
                mode: data.mode, domain: data.domain, preset: data.preset, 
                motion: data.motion, concept: data.concept
            });
        }

        const imageNames = req.files ? req.files.map(f => f.originalname) : null;
        await db.addLog(activeId, 'user', currentInput, imageNames);
        await db.addLog(activeId, 'ai', finalReply, null);

        projectHistory.push({ role: "user", parts: [{ text: currentInput }] });
        projectHistory.push({ role: "model", parts: [{ text: finalReply }] });

        res.json({ success: true, reply: finalReply, projectId: activeId });

    } catch (error) {
        console.error("❌ عطل تقني:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

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

app.listen(3000, () => console.log("🚀 Cortex Engine v1.5.1 الشامل مُفعل وجاهز للإنتاج"));