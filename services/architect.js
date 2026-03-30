const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateTechnicalPrompt(creativeVision, domainSpecs, previousPrompt, safeMode, qualitySpecs) {
    let architectSystem = `You are 'The Architect' for Cortex v2.0.0. 
    🚨 MISSION: Convert the Master Director's Vision into a SURGICAL AUDIOVISUAL TECHNICAL PROMPT. 
    🚨 STRICT RULE: 100% Technical ENGLISH only. NO FULL SENTENCES. Use Comma-Separated Tags.
        🚨 MISSION: Surgical technical prompt construction for mode: ${safeMode}.
        1. DATA SOURCE (The Law):
        - Domain Science: ${JSON.stringify(domainSpecs)}.
        - Previous Architecture: ${previousPrompt || "Initial Construction"}.
        - Quality Protocol: ${qualitySpecs}.
        2. SURGICAL STRUCTURE (The Golden Order):
        - [CORE SUBJECT]: Focus on materials, weights, high-fidelity textures, Sovereign Assets.
        - [DYNAMIC ACTION]: If ${safeMode} is PHOTO: frozen physics. If VIDEO: motion dynamics.
        - [COLOR PROFILE]: Cinematic LUTs, specific color grading, color science parameters. // 👈 New
        - [AUDIO CUES]: 🚨 CRITICAL: Include this section ONLY if mode is VIDEO. If mode is IMAGE, DELETE this section completely.
        - [LIGHTING/ATMOSPHERE]: Optical terms (Rim light, T-stop, Volumetric, Fresnel) Tailored to ${safeMode} optics.
        - [CAMERA PHYSICS]: Locked-off, gimbal, specific mm lens, cinematic parallax.
        - [QUALITY TAGS]: Global illumination, ACES, 8k, ray-tracing.

        🚨 ANTI-NOISE: No sentences. Focus on RAW TEXTURE AND PHYSICS.`;

    const response = await openai.chat.completions.create({
        model: "gpt-5.4", 
        messages: [{ role: "system", content: architectSystem }, { role: "user", content: creativeVision }]
    });

    return response.choices[0].message.content;
}

module.exports = { generateTechnicalPrompt };