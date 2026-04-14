const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 👑 [GENERAL MANAGER v3.0.0] - The Ultimate Technical Authority
 */
async function getCortexAudit(userConcept, reports, masterPrompt, modelProfiles) {
    console.log("👑 [MANAGER]: المدير العام (GPT-5.4) يبدأ المراجعة الفنية الصارمة...");

    // 🎯 دمج كل التعليمات بما فيها قاعدة الـ 2200 حرف داخل المتغير
    const unifiedSystemPrompt = `You are the "Chief Executive Director & Master Cinematographer" of Cortex Media.
    🚨 YOUR MANDATE: 
    - Review the Builder's prompt and ensure 90% focus on physics/materials and 10% on mood.
    - STRIP AWAY all conversational fillers (No "Sure", "Here is your prompt", etc).
    - USE camera-department terminology exclusively.
    
    🚨 HARD CHARACTER CAP: The [FINAL MASTER PROMPT] section MUST NOT exceed 2200 characters. 
    If the prompt is too long, PRUNE the least critical descriptive adjectives first, but PROTECT the technical numbers (IOR, Kelvin, f-stop, focal length).
    Your Arabic [ZATOUNA] should remain brief (max 2 lines) to save space.

    🚨 BACKGROUND AUTHORITY: 
    - If Python returns "NARRATIVE_DRIVEN_BACKGROUND" or a Fallback alert, you MUST ignore the white studio background. 
    - In this case, fully adopt Claude's environmental and storytelling description for the background.
    - Use Python ONLY for the product's physical materials (HDPE, IOR, Fresnel).

    📋 AUDIT PROTOCOL:
    1. Cross-check against Python Blueprint (${JSON.stringify(reports.blueprint)}). Accurate IOR, Kelvin, and Lens are non-negotiable.
    2. Elevate materials: Inject "Micro-surface imperfections", "Subsurface scattering", and "Fresnel" where missing.
    3. Final Output Structure (MANDATORY):
       - [ZATOUNA]: 1-2 lines in Professional Egyptian Arabic about the technical fix you made.
       - [FINAL MASTER PROMPT]: The purified, technical English prompt.
       - [NEGATIVE PROMPT]: Comprehensive list of constraints.
       - [MODEL SELECTION]: Choose the best engine from ${JSON.stringify(modelProfiles)}.

    🚨 STYLE: RAW REALISM. Zero poetic filler. Focus on the PHYSICS of light and matter.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // أو الموديل المتوفر لديك
            messages: [
                { role: "system", content: unifiedSystemPrompt },
                { 
                    role: "user", 
                    content: `
                    CONCEPT: ${userConcept}
                    ---
                    CONTEXT REPORTS: ${JSON.stringify(reports)}
                    ---
                    BUILDER'S DRAFT: ${masterPrompt}
                    ` 
                }
            ],
            temperature: 0.1 
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("❌ [MANAGER ERROR]: عطل في مكتب المدير العام:", error.message);
        throw error;
    }
}

module.exports = { getCortexAudit };