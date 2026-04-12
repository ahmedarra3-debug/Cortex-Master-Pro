const geminiService = require('./geminiService');
const claudeService = require('./claudeService');
const deepseekService = require('./deepseekService');
const pythonArchitectService = require('./pythonArchitectService'); 
const promptBuilderService = require('./promptBuilderService'); 
const criticService = require('./criticService');
/**
 * 🎬 وظيفة المايسترو (The Orchestrator) - v3.0.0 [Steptronic & Dual-Payload]
 */
async function processProduction(params) {
    const { 
        concept, history, files, safeMode, 
        domainSpecs, previousPrompt, qualitySpecs, modelProfiles,
        uiSelections 
    } = params;

    console.log("--------------------------------------------------");
    console.log(`🧠 [BOARD v3.0]: Mode: ${safeMode} | Domain: ${domainSpecs?.label || 'General'}`);

    try {
        // ---------------------------------------------------------
        // 🛑 المحطة الأولى: مكتب الاستقبال (Gemini)
        // ---------------------------------------------------------
        console.log("🛎️ [BOARD]: جيمناي يحلل طلب العميل والصور المرفقة...");
        const rawGeminiOutput = await geminiService.getGeminiCreativeSoul(concept, history, files, domainSpecs);

        // ✂️ التعديل الأول: المقص البرمجي (فصل العربي عن الإنجليزي)
        let arabicVisionForUser = rawGeminiOutput;
        let englishPayloadForBots = "";
        
        if (rawGeminiOutput.includes('|||')) {
            const parts = rawGeminiOutput.split('|||');
            arabicVisionForUser = parts[0].trim();       
            englishPayloadForBots = parts[1].trim();     
            console.log("✅ [BOARD]: تم فصل التقرير المزدوج بنجاح.");
        } else {
            console.warn("⚠️ [BOARD]: التقرير لم يحتوي على فواصل، سيتم التعامل معه ككتلة واحدة.");
            englishPayloadForBots = rawGeminiOutput; // كإجراء وقائي
        }

        // ---------------------------------------------------------
        // ⚙️ المحطة الثانية: محرك البايثون (كتالوج القواعد)
        // ---------------------------------------------------------
        console.log("🐍 [BOARD]: محرك بايثون يبني الأساس الهندسي...");
        // التعديل الثاني: تمرير domainSpecs عشان بايثون يعرف إحنا في أي مجال
        const pythonBlueprint = await pythonArchitectService.getPythonBlueprint(uiSelections, domainSpecs);

        // ---------------------------------------------------------
        // 🧠 المحطة الثالثة: ورشة الخبراء (Claude & DeepSeek)
        // ---------------------------------------------------------
        console.log("🚀 [BOARD]: إطلاق الخبراء لتطويع الفيزياء والجماليات...");
        // التعديل الثالث: إرسال الـ English Payload الصافي فقط للماكينات
        const [visualReport, physicsReport] = await Promise.all([
            claudeService.getClaudeVisualVision(englishPayloadForBots, pythonBlueprint, domainSpecs),
            deepseekService.getDeepSeekPhysics(englishPayloadForBots, pythonBlueprint, domainSpecs)
        ]);

        // التقرير المجمع للمهندس
        const reports = { 
            soul: englishPayloadForBots, // نرسل الإنجليزي فقط للمهندس
            visual: visualReport, 
            physics: physicsReport, 
            blueprint: pythonBlueprint 
        };

        // ---------------------------------------------------------
        // 🏗️ المحطة الرابعة: المهندس المجمّع (GPT-4)
        // ---------------------------------------------------------
        console.log("🏛️ [BOARD]: المهندس يسبك البرومبت النهائي المشترك...");
        const technicalPrompt = await promptBuilderService.buildFinalPrompt(
            concept, reports, domainSpecs, safeMode, previousPrompt, qualitySpecs
        );

        // ---------------------------------------------------------
        // 🕵️ المحطة الخامسة: الناقد الاستراتيجي (GPT-5/4o)
        // ---------------------------------------------------------
        console.log('🕵️ [BOARD]: الناقد يراجع ملف القضية ويختار الموديل...'); 
        const auditOutput = await criticService.getCortexAudit(
            concept, reports, technicalPrompt, modelProfiles
        ); 

        // ---------------------------------------------------------
        // 📤 إرسال النتيجة النهائية
        // ---------------------------------------------------------
        return {
            vision: arabicVisionForUser, // التعديل الرابع: إرجاع الجزء العربي الصافي فقط للعميل
            technical: technicalPrompt,
            finalReview: auditOutput,
            detailedReports: reports,
            expertMonitor: {
                gemini_eye: englishPayloadForBots,
                python_architect: pythonBlueprint,
                claude_artist: visualReport,
                deepseek_scientist: physicsReport,
                builder_draft: technicalPrompt,
                manager_audit: auditOutput
            } 
        };

    } catch (error) {
        console.error("❌ [BOARD ERROR]:", error.message);
        throw error;
    }
}

module.exports = { processProduction };