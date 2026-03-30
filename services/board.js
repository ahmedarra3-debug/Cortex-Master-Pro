const geminiService = require('./geminiService');
const claudeService = require('./claudeService');
const deepseekService = require('./deepseekService');
const architectService = require('./architectService');
const criticService = require('./criticService');

/**
 * 🎬 وظيفة المايسترو (The Orchestrator) - v2.1.0
 */
async function processProduction(params) {
    const { 
        concept, history, files, safeMode, 
        domainSpecs, previousPrompt, qualitySpecs, modelProfiles 
    } = params;

    console.log("--------------------------------------------------");
    console.log(`🧠 [BOARD v2.1.0]: Mode: ${safeMode} | Domain: ${domainSpecs?.label || 'General'}`);

    try {
        // --- المرحلة الأولى: العصف الذهني المتوازي (السرعة) ---
        console.log("🚀 [BOARD]: إطلاق الاستشاريين (Gemini, Claude, DeepSeek)...");
        
        const [soulReport, visualReport, physicsReport] = await Promise.all([
            geminiService.getGeminiCreativeSoul(concept, history, files, domainSpecs),
            claudeService.getClaudeVisualVision(concept, domainSpecs),
            deepseekService.getDeepSeekPhysics(concept, domainSpecs)
        ]);

        const reports = { soul: soulReport, visual: visualReport, physics: physicsReport };

        // --- المرحلة الثانية: المهندس التنفيذي (التنفيذ) ---
        // 🚨 التعديل: بعتنا هنا الـ qualitySpecs عشان الدستور يكمل
        console.log("🏛️ [BOARD]: المهندس يبني الهيكل التقني...");
        const technicalPrompt = await architectService.getArchitectMasterPrompt(
            concept, 
            reports, 
            domainSpecs, 
            safeMode, 
            previousPrompt,
            qualitySpecs // 👈 ده اللي كان ناقص يا ريس!
        );

        // --- المرحلة الثالثة: الناقد الاستراتيجي (الرقابة) ---
        console.log('🕵️ [BOARD]: الناقد يراجع "ملف القضية" بالكامل...'); 
        
        const auditOutput = await criticService.getCortexAudit(
            concept, 
            reports, 
            technicalPrompt, 
            modelProfiles
        ); 

        return {
            vision: soulReport,
            technical: technicalPrompt,
            finalReview: auditOutput,
            detailedReports: reports 
        };

    } catch (error) {
        console.error("❌ [BOARD ERROR]:", error.message);
        throw error;
    }
}

module.exports = { processProduction };