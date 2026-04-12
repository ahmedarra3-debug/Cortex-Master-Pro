const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 🏗️ [PROMPT BUILDER v3.0] - The Master Assembler (GPT-4)
 * المهمة: دمج مخرجات (Gemini, Claude, DeepSeek, Python) في برومبت سينمائي نهائي.
 */
async function buildFinalPrompt(userConcept, reports, domainSpecs, safeMode, previousPrompt, qualitySpecs) {
    console.log("🏗️ [BUILDER]: جاري دمج التقارير وصياغة الكادر النهائي...");

    let builderSystem = `You are the 'Lead Technical Cinematographer' for Cortex Media.
    🚨 YOUR MISSION: Assemble a HIGH-END CINEMATIC PROMPT by merging 4 expert reports.
    
    CRITICAL INSTRUCTION: 
    - Output ONLY the final structured prompt. 
    - ZERO conversational filler. 
    - Start IMMEDIATELY with the first section.
    - STYLE: Focus on RAW REALISM. Avoid "AI-ish" buzzwords. Use professional cinematography language.

    1. CONSTRUCTION LOGIC:
       - Focus 90% on technical physics and materials, 10% on mood.
       - Use professional cinematography terms (e.g., Subsurface Scattering, IOR, Fresnel, Anamorphic).
       - TRUST the Python Blueprint and DeepSeek for technical numbers.

    2. MANDATORY STRUCTURE:
       - [VISUAL NARRATIVE]: A single, dense technical description of the scene's physics and lighting. NO poetry.
       - [TECHNICAL TAGS]: Pure technical metadata (Subject, Lighting, Lens, Physics, Materials).
       - [NEGATIVE CONSTRAINTS]: High-power list of what to avoid (e.g., flat lighting, plastic textures).
       - [QUALITY]: ${qualitySpecs}`;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // المحرك الأساسي للتجميع الذكي
            messages: [
                { role: "system", content: builderSystem },
                { 
                    role: "user", 
                    content: `
                    Concept: ${userConcept}
                    ---
                    REPORTS:
                    - Soul/Intent: ${reports.soul}
                    - Visual Aesthetics: ${reports.visual}
                    - Scientific Physics: ${reports.physics}
                    - Technical Blueprint: ${reports.blueprint}
                    ---
                    Domain: ${JSON.stringify(domainSpecs)}
                    ` 
                }
            ],
            temperature: 0.4 // توازن بين الدقة واللمسة الإبداعية في الربط
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("❌ [PROMPT BUILDER ERROR]:", error.message);
        throw error;
    }
}

module.exports = { buildFinalPrompt };