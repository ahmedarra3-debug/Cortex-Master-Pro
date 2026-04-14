const axios = require('axios');

/**
 * 🧪 [DEEPSEEK PHYSICS v3.1] - The Scientific Core (Optimized)
 * المهمة: حساب أدق المعايير الفيزيائية بناءً على أوامر المخرج وقواعد بايثون.
 * التحديث: رفع التايم آوت لـ 120 ثانية لضمان استقرار موديل الـ Reasoner.
 */
async function getDeepSeekPhysics(englishPayload, pythonBlueprint, domainSpecs) {
    console.log("🧬 [DEEPSEEK]: جاري إجراء الحسابات الفيزيائية والمحاكاة (مساحة تفكير موسعة)...");

    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-reasoner", // الموديل العبقري في المنطق
            messages: [
                { 
                    role: "system", 
                    content: `You are the "Senior Cinematic Physics Engineer" at Cortex Media.
                    Your mission: Generate precise physical and camera parameters for high-end render engines (Unreal Engine 5.4, Octane, V-Ray).

                    🚨 [OPERATIONAL PROTOCOL]:
                    1. INPUT DATA: You will receive a "Gemini Payload" (User intent/expertise) and a "Python Blueprint" (Standard domain rules).
                    2. THE GOLDEN RULE (Steptronic): If the User is an "Expert" and provided "Supreme Commands" (e.g., specific FOV, Shutter Speed, or IOR), these commands OVERRIDE the Python Blueprint.
                    3. DATA FILLING: Use the Python Blueprint for any parameters not specified by the user.
                    4. PRECISION: Provide exact numerical values for: 
                       - Camera: FOV, Focal Length, Aperture (f-stop), Shutter Speed.
                       - Physics: IOR (Index of Refraction), Viscosity (for liquids), Gravity scale, Surface Tension.
                       - Rendering: Samples, Ray-depth, Denoiser settings.

                    🚨 [OUTPUT FORMAT]:
                    Provide the data in clear technical English tags only. No prose, no conversational text.
                    Example: [FOV: 24 | Shutter: 1/100 | IOR: 1.48 | Viscosity: High]`
                     
                },
                { 
                    role: "user", 
                    content: `
                    DOMAIN: ${domainSpecs?.label || 'General'}
                    
                    [GEMINI PAYLOAD]: 
                    ${englishPayload}
                    
                    [PYTHON BLUEPRINT]: 
                    ${pythonBlueprint}
                    ` 
                }
            ]
        }, {
            headers: { 
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            // 🚀 تم رفع الوقت لـ 120 ثانية (دقيقتين) عشان الموديل يلحق يخلص الـ Reasoning
            timeout: 120000 
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.error("❌ [DEEPSEEK ERROR]: الموديل استغرق وقتاً طويلاً جداً (Timeout).");
        } else {
            console.error("❌ [DEEPSEEK ERROR]:", error.response?.data || error.message);
        }
        throw error;
    }
}

module.exports = { getDeepSeekPhysics };