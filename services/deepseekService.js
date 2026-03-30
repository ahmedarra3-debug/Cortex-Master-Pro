const axios = require('axios');

async function getDeepSeekPhysics(concept, domainSpecs) {
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
        model: "deepseek-reasoner",
        messages: [
            { 
                role: "system", 
                content: `أنت "خبير الفيزياء السينمائية" في Cortex Media. 
                مهمتك: تقديم الأرقام والمعايير التقنية الصارمة فقط.
                حدد: زوايا الكاميرا (Fov)، سرعة الغالق (Shutter Speed)، قوانين اللزوجة (Viscosity)، ومعامل الانكسار (IOR).
                استخدم لغة تقنية بحتة موجهة لماكينات الرندر.` 
            },
            { role: "user", content: `المجال: ${domainSpecs?.label || 'General Creative'}. الطلب: ${concept}` }
        ]
    }, {
        headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` }
    });
    return response.data.choices[0].message.content;
}

module.exports = { getDeepSeekPhysics };