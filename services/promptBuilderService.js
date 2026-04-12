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

    1. THE INPUT SOURCES:
       - [The Soul - Gemini]: The artistic narrative and user intent.
       - [The Blueprint - Python]: The hard technical standards (IOR, Kelvin, Lens).
       - [The Artist - Claude]: Visual textures, lighting details, and color grading.
       - [The Physicist - DeepSeek]: Mathematical camera specs and physical simulations.

    2. CONSTRUCTION LOGIC:
       - DO NOT hallucinate new physics. TRUST the Python Blueprint and DeepSeek reports.
       - USE the "Supreme Commands" from Gemini if the user is an expert.
       - MERGE the artistic flare of Claude with the technical precision of the others.

    3. MANDATORY PROMPT STRUCTURE:
       - [VISUAL NARRATIVE]: 1-2 powerful, evocative sentences describing the scene's mood.
       - [TECHNICAL TAGS]: Combined tags for: Subject, Lighting (specific Kelvin), Camera (mm, f-stop, Shutter), Physics (IOR, Viscosity), Materials (Textures, SSS), Post-processing.
       - [QUALITY]: Inject these specs: ${qualitySpecs}

    🚨 STYLE: Focus on RAW REALISM. Avoid "AI-ish" buzzwords. Use professional cinematography language.`;

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