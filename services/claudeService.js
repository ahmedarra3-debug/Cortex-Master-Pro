const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const { sanitizeLogPayload } = require('./utils/logSanitizer');
const { parseDtoResponse } = require('./utils/dtoHandler');
const { readPromptWithCache } = require('./utils/promptCache');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
const claudeSystemTemplate = readPromptWithCache(
    path.join(__dirname, '../prompts/claude.system.txt')
);
const CLAUDE_DTO_DEFAULTS = Object.freeze({
    technicalPrompt: "Balanced visual architecture with production-grade composition and lighting.",
    negativePrompt: "flat lighting, clipped highlights, muddy contrast, plastic-looking surfaces",
    modelSelection: "claude-sonnet-4-6"
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
                max_tokens: 1500, 
                system: [
                    {
                        type: "text",
                        text: claudeSystemTemplate,
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
        const rawClaudeText = response.content[0]?.text || "";
        
        return parseDtoResponse(rawClaudeText, CLAUDE_DTO_DEFAULTS, {
            logger: console,
            warningTag: "CLAUDE DTO"
        });
        
    } catch (error) {
        console.error("❌ [CLAUDE VISUAL ERROR]:", sanitizeLogPayload(error.message || "Unknown Claude error"));
        throw error;
    }
}

module.exports = { getClaudeVisualVision };