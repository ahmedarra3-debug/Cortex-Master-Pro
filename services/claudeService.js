const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

async function getClaudeVisualVision(concept, domainSpecs) {
    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6", // سيتم تحديثه لـ 4.6 فور توفره في الـ API
        max_tokens: 1024,
        system: `أنت "الفنان البصري" في شركة Cortex Media. 
        مهمتك: وصف الجماليات السينمائية فقط (الإضاءة، تدرج الألوان، ملمس الأسطح، وانعكاسات الضوء).
        ركز على التفاصيل الدقيقة مثل الـ Specular Highlights ولزوجة السوائل.
        لا تتحدث عن زوايا الكاميرا أو الفيزياء، ركز على "جمال اللقطة" كلوحة فنية.`,
        messages: [{ role: "user", content: `المجال: ${domainSpecs?.label || 'General Creative'}. الرؤية: ${concept}` }]
    });
    return response.content[0].text;
}

module.exports = { getClaudeVisualVision };