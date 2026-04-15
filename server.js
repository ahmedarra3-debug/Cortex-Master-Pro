// ============================================================================
// 📦 1. استيراد المكتبات الأساسية (التروس اللي بتشغل المكنة)
// ============================================================================
const express = require('express'); 
const multer = require('multer'); 
const fs = require('fs'); 
require('dotenv').config(); 
const db = require('./database');
const board = require('./services/board');
const { buildProductionSpecs } = require('./services/logic/specsService');
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

app.use(express.json()); 
app.use(express.static('public')); 

// 🎬 5. الراوت الرئيسي (Cortex Engine v3.0.0 - The Visionary Director)
app.post('/produce', upload.fields([
    { name: 'refImages', maxCount: 5 }, 
    { name: 'start_frame', maxCount: 1 }, 
    { name: 'end_frame', maxCount: 1 }   
]), async (req, res) => {
    
    const data = req.body; 
    let activeId = data.projectId; 
    const {
        uiSelections,
        safeMode,
        selectedDomain,
        currentInput,
        domainSpecs,
        qualitySpecs,
        modelProfiles
    } = buildProductionSpecs(data, imageScience, videoScience);

    console.log("--------------------------------------------------");
    console.log(`🎬 [REQUEST]: استلام طلب إنتاج جديد...`);
    console.log(`🎯 [MODE]: ${safeMode}`); 
    console.log(`📍 [DOMAIN]: ${selectedDomain || 'auto'}`);
    console.log("--------------------------------------------------");

    try {
        const { history } = await getProjectContext(activeId);

        // 🚀 ج. إرسال المهمة لـ "غرفة العمليات" (Board)
        const result = await board.processProduction({
            concept: currentInput,
            history: history,
            files: extractFiles(req.files, data.mode), 
            safeMode: safeMode,
            domainSpecs: domainSpecs,
            qualitySpecs: qualitySpecs,
            uiSelections: uiSelections, // 👈 السلك الجديد وصل هنا
            modelProfiles: modelProfiles
        });
        // ==========================================
        // 👇اضافة سطر لعدد حروف البرومبت👇
        // ==========================================
        console.log("--------------------------------------------------");
        console.log("📏 [STATS]: طول البرومبت النهائي:", result.technical.length, "حرف.");
        if (result.technical.length > 2200) {
            console.warn("⚠️ [WARNING]: البرومبت تخطى الحد المسموح (2200)!");
        }
        console.log("--------------------------------------------------");
        // 💾 د. الأرشفة والرد النهائي
        const finalReply = result.vision + "\n\n" + result.finalReview;
        
        // حفظ المشروع لو جديد (نفس منطقك القديم)
        if (!activeId) {
            activeId = await db.saveProject({
                mode: data.mode || 'photo', domain: data.domain, preset: data.model, 
                motion: data.motion_scale, concept: data.concept
            });
        }
        await db.addLog(activeId, 'user', currentInput, null);
        await db.addLog(activeId, 'ai', finalReply, null);

        res.json({ 
            success: true, 
            reply: finalReply,          // الكلام العربي + مراجعة المدير
            technical: result.technical, // البرومبت الإنجليزي الصافي (عشان لو عايز زرار Copy)
            expertMonitor: result.expertMonitor, // 👈 التعديل الجوهري: سجل الخبراء بالكامل
            projectId: activeId 
        });
    } catch (error) {
        console.error("❌ عطل في المحرك:", error.message);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        // 🧹 هـ. تنظيف "الرايش" (استخدام العامل المساعد 3)
        cleanupFiles(req.files);
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
    console.log("🚀 Cortex Engine v3.0.0 - The Visionary Director Ready");
    console.log("--------------------------------------------------");
});
// ============================================================================
// 🛠️ الدالات المساعدة (Helpers - العمال المتخصصين)
// ============================================================================

// 1. دالة استعادة سياق المشروع (الذاكرة)
async function getProjectContext(projectId) {
    if (!projectId) return { history: [] };
    
    const logs = await db.getProjectHistory(projectId);
    
    // تحويل اللوج لنمط يفهمه جيمناي
    const history = logs.map(log => ({
        role: log.role === 'user' ? 'user' : 'model',
        parts: [{ text: log.content }]
    }));

    return { history };
}

// 2. دالة تنقية الملفات (بناءً على المود)
function extractFiles(files, mode) {
    if (!files) return [];
    const fields = mode === 'video' ? ['start_frame', 'end_frame'] : ['refImages'];
    let list = [];
    fields.forEach(f => {
        if (files[f]) list = [...list, ...files[f]];
    });
    return list;
}

// 3. دالة تنظيف "رايش" الصور (المسح)
function cleanupFiles(files) {
    if (!files) return;
    Object.values(files).flat().forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
    });
}