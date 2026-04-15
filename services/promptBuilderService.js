const fs = require("fs");
const path = require("path");
const { openai } = require("./llm/openaiClient");
const { sanitizeLogPayload } = require("./utils/logSanitizer");
const { parseDtoResponse } = require("./utils/dtoHandler");

const builderSystemTemplate = fs.readFileSync(
    path.join(__dirname, "../prompts/promptBuilder.system.txt"),
    "utf8"
);

const BUILDER_DTO_DEFAULTS = Object.freeze({
    technicalPrompt: "",
    negativePrompt: "",
    modelSelection: "gpt-4o"
});

/**
 * 🏗️ [PROMPT BUILDER v3.0] - The Master Assembler (GPT-4)
 */
async function buildFinalPrompt(userConcept, reports, domainSpecs, qualitySpecs) {
    console.log("🏗️ [BUILDER]: جاري دمج التقارير وصياغة الكادر النهائي...");

    const builderSystemPrompt = builderSystemTemplate.replace("{{QUALITY_SPECS}}", qualitySpecs);

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o", 
            messages: [
                { role: "system", content: builderSystemPrompt },
                { 
                    role: "user", 
                    content: `
                    Concept: ${userConcept}
                    ---
                    REPORTS:
                    - Soul/Intent: ${reports.soul}
                    - Visual Aesthetics: ${reports.visual}
                    - Scientific Physics: ${reports.physics}
                    - Technical Blueprint: ${reports.blueprint}
                    ---
                    Domain: ${JSON.stringify(domainSpecs)}
                    ` 
                }
            ],
            temperature: 0.4 
        });

        return parseDtoResponse(response.choices[0].message.content || "", BUILDER_DTO_DEFAULTS, {
            logger: console,
            warningTag: "BUILDER DTO"
        });
    } catch (error) {
        console.error("❌ [PROMPT BUILDER ERROR]:", sanitizeLogPayload(error.message || "Unknown builder error"));
        throw error;
    }
}

module.exports = { buildFinalPrompt };