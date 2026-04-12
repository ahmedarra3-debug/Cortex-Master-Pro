require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function listModels() {
  try {
    console.log("🕵️ جاري استجواب مكتب OpenAI الرئيسي...");
    const list = await openai.models.list();
    
    // فلترة الموديلات المهمة بس عشان الزحمة
    const importantModels = list.data
      .filter(m => m.id.includes('gpt') || m.id.includes('o1'))
      .map(m => ({ ID: m.id, Created: new Date(m.created * 1000).toLocaleDateString() }));

    console.log("✅ الموديلات المتاحة لمفتاحك هي:");
    console.table(importantModels);
    
  } catch (err) {
    console.error("❌ فشل في جلب الموديلات:", err.message);
  }
}

listModels();