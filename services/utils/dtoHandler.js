function stripCodeFences(rawText) {
    let text = String(rawText || "").trim();
    
    // 1. محاولة استخراج ما بين أول { وآخر } لضمان الحصول على JSON فقط
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        text = jsonMatch[0];
    }

    // 2. تنظيف أي بقايا علامات مارك داون (زيادة تأكيد)
    return text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
}

function coerceWithDefaults(parsed, defaults) {
    const output = { ...defaults };
    for (const [key, defaultValue] of Object.entries(defaults)) {
        const candidate = parsed?.[key];
        if (candidate === undefined || candidate === null || candidate === "") {
            output[key] = defaultValue;
            continue;
        }
        output[key] = String(candidate).trim();
    }
    return output;
}

function parseDtoResponse(rawText, defaults, options = {}) {
    const { logger = console, warningTag = "DTO" } = options;
    const cleaned = stripCodeFences(rawText);

    try {
        const parsed = JSON.parse(cleaned);
        return coerceWithDefaults(parsed, defaults);
    } catch (_) {
        if (logger?.warn) {
            logger.warn(`⚠️ [${warningTag} WARNING]: Invalid JSON. Using fallback DTO defaults.`);
        }
        return {
            ...defaults,
            ...(options.useRawTextAsFirstField && Object.keys(defaults).length
                ? { [Object.keys(defaults)[0]]: cleaned || defaults[Object.keys(defaults)[0]] }
                : {})
        };
    }
}

module.exports = { parseDtoResponse, stripCodeFences };
