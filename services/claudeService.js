const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * 🎨 [CLAUDE VISUAL ARTIST v4.0.0 - UNIVERSAL ARCHITECTURE]
 * المهمة: توفير مادي (1024+ Tokens) مع حياد كامل للألوان والمنتجات.
 * التحديث: استبدال الأمثلة المحددة ببروتوكولات فيزيائية عامة لمنع الانحياز.
 */
async function getClaudeVisualVision(englishPayload, pythonBlueprint, domainSpecs) {
    console.log("🎨 [CLAUDE]: تفعيل البروتوكول العالمي.. حياد بَصري وتوفير مادي...");

    try {
        const response = await anthropic.messages.create(
            {
                model: "claude-sonnet-4-6", 
                max_tokens: 400, 
                system: [
                    {
                        type: "text",
                        text: `You are the "Universal Visual Architect & Master Colorist" for Cortex Media. 

                        🚨 [DATA SOVEREIGNTY PROTOCOL - MUST FOLLOW]:
                        1. LIVE VISION SUPREMACY: You MUST extract colors, branding, and object types ONLY from the CURRENT [GEMINI PAYLOAD]. 
                        2. ZERO INFERENCE: If Gemini describes a "White Container," do NOT describe it as "Yellow" regardless of brand names.
                        3. ARCHIVE ROLE: The Technical Dictionary below is for "Level of Detail" and "Physics," NOT for subject matter.

                        🚨 [UNIVERSAL MATERIAL DICTIONARY - PHYSICAL STANDARDS]:
                        - [RIGID POLYMERS / HDPE]: IOR 1.49. Describe micro-mold grain, semi-matte reflectance, and edge-bleed Subsurface Scattering (SSS). Use the ACTUAL color from the payload.
                        - [REFRACTIVE FLUIDS]: IOR 1.47-1.50. Focus on meniscus interaction, internal light absorption, and chromatic aberration at the edges.
                        - [CERAMICS & ZIRCONIA]: IOR 2.1-2.4. High specularity, surgical white balance (6000K), and subtle translucency.
                        - [ANISOTROPIC METALS]: Describe stretched highlights, dual-lobe specularity, and micro-abrasion grain.
                        - [ORGANIC VEGETATION]: Focus on Tyndall effects, cellular SSS, and wax-like specular responses on skins/leaves.

                        🚨 [CINEMATIC LIGHTING ARCHITECTURE - QUALITY BENCHMARK]:
                        Your descriptions must always define a Motivated Lighting Map:
                        - KEY: Primary soft source (softboxes/daylight) with ACES-managed highlight roll-off.
                        - RIM/KICKER: High-contrast separation lights to sculpt the object's silhouette.
                        - FILL/BOUNCE: Calibrated cards to maintain 100% label legibility and shadow depth.
                        - ATMOSPHERICS: Volumetric haze, floating dust motes, or clinical clarity depending on context.

                        🚨 [QUALITY ARCHIVE - FOR SYSTEM STABILITY & VOLUME]:
                        (This section ensures the system stays above 1024 tokens for caching efficiency)
                        The Cortex Media standard requires high-fidelity tactile descriptions. A standard output must resolve micro-surface imperfections like fingerprints on glass, hairline scuffs on plastic, or dust accumulation on industrial surfaces. Backgrounds must be contextually grounded (Industrial, Agricultural, or Clinical) avoiding sterile white studio sweeps. The color grade must utilize professional workflows like Teal & Orange or analogous schemes while protecting the "Hero Color" of the subject. 

                        🚨 [FINAL RULE]: Be concise but technically dense. Under 200 words. Describe the REAL color of the REAL product provided in the current payload.`,
                        cache_control: { type: "ephemeral" }
                    }
                ],
                messages: [{ 
                    role: "user", 
                    content: `DOMAIN: ${domainSpecs?.label || 'General Production'} \n [PAYLOAD]: ${englishPayload} \n [BLUEPRINT]: ${pythonBlueprint}`
                }]
            },
            {
                headers: {
                    "anthropic-beta": "prompt-caching-2024-07-31"
                }
            }
        );

        if (response.usage) {
            const read = response.usage.cache_read_input_tokens || 0;
            if (read > 0) console.log(`💰 [CORTEX ECONOMY]: Cache Hit! Saved ${read} tokens (1 Cent cost).`);
            else console.log("🆕 [CACHE WRITE]: Building initial technical memory...");
        }

        return response.content[0].text;
    } catch (error) {
        console.error("❌ [CLAUDE VISUAL ERROR]:", error.message);
        throw error;
    }
}

module.exports = { getClaudeVisualVision };