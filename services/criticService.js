const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 👑 [GENERAL MANAGER v3.0.0] - The Ultimate Critic & Authority
 * المهمة: الرقابة العليا على الـ Builder، التأكد من تنفيذ "أوامر المخرج أحمد"، وختم الرندر.
 */
async function getCortexAudit(userConcept, reports, masterPrompt, modelProfiles) {
    console.log("👑 [MANAGER]: المدير العام (GPT-5.4) يستلم الملف للمراجعة النهائية...");

    const auditSystem = `You are the "Chief Executive Director (CEO)" of Cortex Media, powered by GPT-5.4. 
    🚨 YOUR AUTHORITY: You oversee the work of the Prompt Builder (GPT-4) and all other AI agents. 

    📋 EXECUTIVE AUDIT PROTOCOL:
    1. 🎯 [The Expertise Check]: If Gemini labeled the user as an "Expert", you must ensure every "Supreme Command" is perfectly integrated. If the Builder (GPT-4) missed even one detail, you must correct it.
    2. 🧪 [Physics & Logic Shield]: Cross-check the Master Prompt against the Python Blueprint (${reports.blueprint}). Ensure the IOR, Kelvin, and Physics are scientifically accurate for the domain.
    3. 💎 [Aesthetic Elevation]: Your taste is elite. Strip away generic descriptions. Add "Micro-surface imperfections", "Subsurface scattering", and "Cinematic Depth" where needed.
    4. 🎰 [Strategic Model Selection]: Based on the final prompt complexity, choose the PERFECT engine from: ${JSON.stringify(modelProfiles)}. 
       - (Rule: High-speed/Fluid -> Wan_2_Image | High-text -> Flux.2 | Ultra-Realism -> Nano_Banana_Pro).
    5. ⚖️ [Final Verdict]: Score the work from 1-10. 10 means it's a global ad agency masterpiece.

    🎬 [Director's Note]: Speak to Director Ahmed in "Professional Egyptian Arabic". 
    Give him the 'Zatouna': (الكادر ده جاهز يكسر الدنيا) or (يا مخرج، أنا عدلت وراك المهندس في كذا عشان النتيجة تطلع فخمة).`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-5.4", // 👈 تم التحديث للموديل الإمبراطوري الخاص بك
            messages: [
                {
                    role: "system", 
                    content: `Act as a world-class technical cinematographer. 
                              Describe the subject's physical materials and lighting interaction with 90% precision. 
                              Use camera-department terminology. Zero poetic or abstract filler.
                      
                              أنت المدير العام لسيرفر Cortex، مهمتك مراجعة تقارير الخبراء وتحويلها لبرومبت تقني فائق الدقة.` 
                },
                { 
                    role: "user", 
                    content: `
                    PROJECT CONCEPT: ${userConcept}
                    ---
                    AGENTS REPORTS (The Context):
                    ${JSON.stringify(reports)}
                    ---
                    BUILDER'S PROPOSED PROMPT (GPT-4):
                    ${masterPrompt}
                    ` 
                }
            ],
            temperature: 0.2 // دقة متناهية وحزم في القرارات
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("❌ [MANAGER ERROR]: عطل في مكتب المدير العام (GPT-5.4):", error.message);
        throw error;
    }
}

module.exports = { getCortexAudit };