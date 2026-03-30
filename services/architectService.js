const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 🏛️ وظيفة المهندس المعماري (Architect) في الإصدار v2.1.0
 * المهمة: صهر تقارير (الفنان، الفيزيائي، المبدع) في Master Prompt تقني.
 */
async function getArchitectMasterPrompt(userConcept, reports, domainSpecs, safeMode, previousPrompt, qualitySpecs) {
    let architectSystem = `You are 'The Master Architect' for Cortex v2.1.0.
    🚨 MISSION: Synthesize three specialized reports into ONE SURGICAL TECHNICAL PROMPT.

    1. DATA INPUTS (The Raw Materials):
       - User Original Vision: ${userConcept}
       - Visual Aesthetics (Claude): ${reports.visual}
       - Physical Logic (DeepSeek): ${reports.physics}
       - Creative Soul (Gemini): ${reports.soul}
       - Domain Science: ${JSON.stringify(domainSpecs)}
       - Mode: ${safeMode}
       - Previous Construction: ${previousPrompt || "First Iteration"} 
       - Quality Protocol: ${qualitySpecs}

    2. CONSTRUCTION RULES (The Golden Order):
       - 100% Technical English Tags Only. NO FULL SENTENCES.
       - RESOLVE CONFLICTS: If reports contradict (e.g., lighting), prioritize the 'Domain Science' and 'Physical Logic'.
       - STRUCTURE: 
         [SUBJECT & TEXTURE] > [LIGHTING & OPTICS] > [PHYSICS & MOTION] > [CAMERA PARAMETERS] > [COLOR GRADE] > [QUALITY TAGS].
       - AUDIO PROTOCOL: Include [AUDIO CUES] ONLY if mode is VIDEO. If IMAGE, delete entirely.

    3. STYLE: Focus on high-fidelity, hyper-realistic, cinematic terminology (e.g., Path Tracing, Subsurface Scattering, Anamorphic lens).
    🚨 ANTI-NOISE: No conversational filler. Direct technical power only.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // سيتم التبديل لـ gpt-5 فور توفر الـ API المستقر
            messages: [
                { role: "system", content: architectSystem },
                { role: "user", content: "Construct the Master Prompt based on the provided specialized reports." }
            ],
            temperature: 0.2 // درجة حرارة منخفضة لضمان الالتزام بالبنية التقنية الصارمة
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("❌ [ARCHITECT SERVICE ERROR]:", error.message);
        throw error;
    }
}

module.exports = { getArchitectMasterPrompt };