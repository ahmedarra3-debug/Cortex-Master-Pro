const axios = require('axios');
require('dotenv').config(); // عشان يسحب مفتاحك من ملف الـ .env

async function getMyClaudeModels() {
    console.log("📡 جاري الاتصال بسيرفرات Anthropic...");

    try {
        const response = await axios.get('https://api.anthropic.com/v1/models', {
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY, // تأكد إن ده اسم المفتاح عندك في الـ .env
                'anthropic-version': '2023-06-01' // البروتوكول الإلزامي
            }
        });

        console.log("--------------------------------------------------");
        console.log("✅ الموديلات المتاحة لحسابك حالياً هي:");
        console.log("--------------------------------------------------");

        // استعراض الموديلات اللي رجعت من السيرفر
        response.data.data.forEach(model => {
            console.log(`🚀 Model ID: ${model.id}`);
            console.log(`📅 Created at: ${model.created_at}`);
            console.log("---");
        });

    } catch (error) {
        console.error("❌ فشل في جلب الموديلات:");
        if (error.response) {
            // لو السيرفر رد بغلط (زي إن المفتاح غلط)
            console.error(`Status: ${error.response.status}`);
            console.log("Message:", JSON.stringify(error.response.data, null, 2));
        } else {
            // لو فيه مشكلة في النت مثلاً
            console.error(error.message);
        }
    }
}

getMyClaudeModels();