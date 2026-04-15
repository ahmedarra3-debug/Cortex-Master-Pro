const ENV_SECRET_KEYS = [
    "OPENAI_API_KEY",
    "GOOGLE_API_KEY",
    "ANTHROPIC_API_KEY",
    "DEEPSEEK_API_KEY"
];

function redactKnownSecrets(text) {
    let safe = text;
    for (const envKey of ENV_SECRET_KEYS) {
        const secret = process.env[envKey];
        if (!secret) continue;
        safe = safe.split(secret).join(`[REDACTED:${envKey}]`);
    }
    return safe;
}

function redactTokenPatterns(text) {
    return text
        .replace(/Bearer\s+[A-Za-z0-9_\-\.]+/g, "Bearer [REDACTED]")
        .replace(/sk-[A-Za-z0-9_\-]+/g, "sk-[REDACTED]")
        .replace(/AIza[0-9A-Za-z\-_]+/g, "AIza[REDACTED]");
}

function sanitizeLogPayload(payload) {
    const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
    const withKnownSecretsRedacted = redactKnownSecrets(raw);
    return redactTokenPatterns(withKnownSecretsRedacted);
}

module.exports = { sanitizeLogPayload };
