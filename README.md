## 🚀 Cortex Engine v4.0.1 - Turbo & Security Update

### ✅ Phase 1: Security & Robustness (Hardening)
- **Rate Limiting**: Added `express-rate-limit` (60 req/min) to prevent API abuse.
- **Input Validation**: Bridge-level check for payloads >50KB.
- **Retry Mechanism**: 3-tier exponential backoff for Python Bridge stability.
- **Health Check**: `checkPythonHealth()` automated on server startup.

### ⚡ Phase 2: Performance Boost (Turbo)
- **Model Optimization**: Switched to `deepseek-chat` for 10x faster reasoning response.
- **Database Engine**: Enabled **SQLite WAL Mode** for concurrent read/write.
- **Parallel Processing**: Refactored `board.js` to run Gemini & Python concurrently using `Promise.all()`.
- **Prompt Caching**: Implemented in-memory `promptCache.js` to reduce Disk I/O.