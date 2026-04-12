const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * 🎨 [CLAUDE VISUAL ARTIST v3.0.0] - The Aesthetic Soul
 * المهمة: تحويل الأوامر التقنية إلى وصف بصري فائق الجمال والواقعية.
 */
async function getClaudeVisualVision(englishPayload, pythonBlueprint, domainSpecs) {
    console.log("🎨 [CLAUDE]: جاري رسم اللوحة البصرية وتنسيق الألوان...");

    try {
        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-6", // النسخة الأحدث والأذكى بصرياً حالياً
            max_tokens: 1024,
            system: `You are the "Senior Visual Director & Lead Colorist" at Cortex Media. 
            Your mission: Translate intent into breathtaking cinematic aesthetics.

            🚨 [ARTISTIC PROTOCOL]:
            1. DATA ANALYSIS: You receive [GEMINI PAYLOAD] (User Intent) and [PYTHON BLUEPRINT] (Technical Standards).
            2. STEPTRONIC RULE (User Supremacy): If the Gemini Payload indicates the User is an "Expert" with "Supreme Commands" regarding lighting or style, you MUST follow them over the Python Blueprint.
            3. VISUAL FOCUS: Focus exclusively on:
               - Lighting Mood: (Softbox, Rembrandt, Rim light, Volumetric rays, God rays).
               - Color Grading: (Teal & Orange, Noir, ACES Film Log, High-dynamic Range).
               - Material Textures: (Subsurface Scattering for skin/fruit, Anisotropic reflections for metal, Micro-surface imperfections, Dust/Grime).
               - Surface Behavior: (Glossy vs Matte contrast, Fresnel effect, Specular Highlights).

            4. NO PHYSICS/CAMERA: Do not talk about FOV, Shutter speed, or IOR. Focus only on the "Beauty" and "Look" of the frame.

            🚨 [OUTPUT STYLE]: 
            Use high-end cinematography language. Describe the "Feeling" of the light and the "Richness" of the materials.
            Language: Professional Cinematic English.`,
            
            messages: [{ 
                role: "user", 
                content: `
                DOMAIN: ${domainSpecs?.label || 'General Creative'}
                
                [GEMINI PAYLOAD]:
                ${englishPayload}
                
                [PYTHON BLUEPRINT]:
                ${pythonBlueprint}
                `
            }]
        });

        return response.content[0].text;
    } catch (error) {
        console.error("❌ [CLAUDE VISUAL ERROR]:", error.message);
        throw error;
    }
}

module.exports = { getClaudeVisualVision };