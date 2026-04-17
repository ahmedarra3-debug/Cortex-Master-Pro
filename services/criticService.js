const path = require("path");
const { openai } = require("./llm/openaiClient");
const { sanitizeLogPayload } = require("./utils/logSanitizer");
const { parseDtoResponse } = require("./utils/dtoHandler");
const { readPromptWithCache } = require("./utils/promptCache");

const auditSystemTemplate = readPromptWithCache(
    path.join(__dirname, "../prompts/critic.system.txt")
);

const AUDIT_DTO_DEFAULTS = Object.freeze({
    technicalPrompt: "",
    negativePrompt: "",
    modelSelection: ""
});

/**
 * 👑 [GENERAL MANAGER v3.0.0] - The Ultimate Technical Authority
 */
async function getCortexAudit(userConcept, reports, builderDraft, modelProfiles) {
    console.log("👑 [MANAGER]: المدير العام (GPT-5.4) يبدأ المراجعة الفنية الصارمة...");

    const unifiedSystemPrompt = auditSystemTemplate
        .replace("{{BLUEPRINT_JSON}}", JSON.stringify(reports.blueprint))
        .replace("{{MODEL_PROFILES_JSON}}", JSON.stringify(modelProfiles));

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // أو الموديل المتوفر لديك
            messages: [
                { role: "system", content: unifiedSystemPrompt },
                { 
                    role: "user", 
                    content: `
                    CONCEPT: ${userConcept}
                    ---
                    CONTEXT REPORTS: ${JSON.stringify(reports)}
                    ---
                    BUILDER'S DRAFT: ${JSON.stringify(builderDraft)}
                    ` 
                }
            ],
            temperature: 0.1 
        });

        return parseDtoResponse(response.choices[0].message.content || "", AUDIT_DTO_DEFAULTS, {
            logger: console,
            warningTag: "MANAGER DTO"
        });
    } catch (error) {
        console.error("❌ [MANAGER ERROR]: عطل في مكتب المدير العام:", sanitizeLogPayload(error.message || "Unknown manager error"));
        throw error;
    }
}

module.exports = { getCortexAudit };