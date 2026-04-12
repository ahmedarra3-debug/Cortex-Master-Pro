const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function listModels() {
  try {
    console.log("🕵️ جاري استجواب سيرفرات Anthropic...");
    // طلب قائمة الموديلات المتاحة لمفتاحك بالظبط
    const list = await anthropic.models.list({ limit: 20 });
    
    console.log("✅ الموديلات المتاحة لحسابك هي:");
    console.table(list.data.map(m => ({ id: m.id, display_name: m.display_name })));
    
  } catch (err) {
    console.error("❌ فشل في جلب الموديلات:", err.message);
    if (err.message.includes("401")) console.log("💡 نصيحة: الـ API Key فيه مشكلة أو مش شغال.");
    if (err.message.includes("403")) console.log("💡 نصيحة: حسابك لسه محتاج شحن رصيد عشان يفتح الموديلات دي.");
  }
}

listModels();