const geminiService = require('./geminiService');
const claudeService = require('./claudeService');
const deepseekService = require('./deepseekService');
const pythonArchitectService = require('./pythonArchitectService'); 
const promptBuilderService = require('./promptBuilderService'); 
const criticService = require('./criticService');
const { sanitizeLogPayload } = require('./utils/logSanitizer');
/**
 * 🎬 وظيفة المايسترو (The Orchestrator) - v3.0.0 [Steptronic & Dual-Payload]
 */
async function processProduction(params) {
    const { 
        concept, history, files, safeMode, 
        domainSpecs, qualitySpecs, modelProfiles,
        uiSelections 
    } = params;

    console.log("--------------------------------------------------");
    console.log(`🧠 [BOARD v3.0]: Mode: ${safeMode} | Domain: ${domainSpecs?.label || 'General'}`);

    try {
        // ---------------------------------------------------------
        // 🛑 المحطة الأولى: مكتب الاستقبال (Gemini)
        // ---------------------------------------------------------
        console.log("🛎️ [BOARD]: جيمناي يحلل طلب العميل والصور المرفقة...");
        const geminiReport = await geminiService.getGeminiCreativeSoul(concept, history, files, domainSpecs);
        const arabicVisionForUser = geminiReport.visionArabic;
        const englishPayloadForBots = [
            `TECHNICAL: ${geminiReport.technicalReport || "N/A"}`,
            `VISUAL: ${geminiReport.visualReport || "N/A"}`,
            `MATERIAL: ${geminiReport.materialReport || "N/A"}`
        ].join("\n");

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
        const [visualDto, physicsDto] = await Promise.all([
            claudeService.getClaudeVisualVision(englishPayloadForBots, pythonBlueprint, domainSpecs),
            deepseekService.getDeepSeekPhysics(englishPayloadForBots, pythonBlueprint, domainSpecs)
        ]);

        // التقرير المجمع للمهندس
        const reports = { 
            soul: englishPayloadForBots, // نرسل الإنجليزي فقط للمهندس
            visual: visualDto.technicalPrompt,
            physics: physicsDto.technicalPrompt,
            blueprint: pythonBlueprint 
        };

        // ---------------------------------------------------------
        // 🏗️ المحطة الرابعة: المهندس المجمّع (GPT-4)
        // ---------------------------------------------------------
        console.log("🏛️ [BOARD]: المهندس يسبك البرومبت النهائي المشترك...");
        const builderDraft = await promptBuilderService.buildFinalPrompt(
            concept, reports, domainSpecs, qualitySpecs
        );

        // ---------------------------------------------------------
        // 🕵️ المحطة الخامسة: الناقد الاستراتيجي (GPT-5/4o)
        // ---------------------------------------------------------
        console.log('🕵️ [BOARD]: الناقد يراجع ملف القضية ويختار الموديل...'); 
        const finalAudit = await criticService.getCortexAudit(
            concept, reports, builderDraft, modelProfiles
        ); 

        const technicalPrompt = finalAudit.technicalPrompt || builderDraft.technicalPrompt || "";
        const negativePrompt = finalAudit.negativePrompt || builderDraft.negativePrompt || "";
        const modelSelection = finalAudit.modelSelection || builderDraft.modelSelection || "";
        const finalReview = [
            "[FINAL MASTER PROMPT]:",
            technicalPrompt,
            "",
            "[NEGATIVE PROMPT]:",
            negativePrompt,
            "",
            "[MODEL SELECTION]:",
            modelSelection
        ].join("\n");

        // ---------------------------------------------------------
        // 📤 إرسال النتيجة النهائية
        // ---------------------------------------------------------
        return {
            vision: arabicVisionForUser, // التعديل الرابع: إرجاع الجزء العربي الصافي فقط للعميل
            technical: technicalPrompt,
            finalReview: finalReview,
            detailedReports: reports,
            expertMonitor: {
                gemini_eye: JSON.stringify(geminiReport, null, 2),
                python_architect: pythonBlueprint,
                claude_artist: JSON.stringify(visualDto, null, 2),
                deepseek_scientist: JSON.stringify(physicsDto, null, 2),
                builder_draft: JSON.stringify(builderDraft, null, 2),
                manager_audit: JSON.stringify(finalAudit, null, 2)
            } 
        };

    } catch (error) {
        console.error("❌ [BOARD ERROR]:", sanitizeLogPayload(error.message || "Unknown board error"));
        throw error;
    }
}

module.exports = { processProduction };