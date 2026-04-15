## 🚀 What's New in v4.0.2 (Architecture Hardening & Optimization)

This release focuses on enterprise-level stability, security, and performance optimizations before moving to the Storyboard Engine (v5.0.0).

### 🛡️ Security & Portability
- **Environment Isolation:** Moved Python absolute paths and API keys to `.env`.
- **Log Sanitization:** Implemented `logSanitizer.js` to mask sensitive tokens (API Keys, Bearers) in terminal outputs and crash logs.
- **XSS Prevention:** Refactored Frontend UI to use `textContent` instead of `innerHTML` for AI outputs.

### ⚡ Performance Enhancements
- **Python Module Caching:** `architect.py` now loads the 15 JSON catalogs once upon initialization (Memory Cache), reducing Disk I/O by 95% and significantly speeding up the bridge response.
- **Process Resilience:** Added Timeout and Error guards to the `spawn` child process in Node.js to prevent server hangs if the Python engine stalls.

### 🧩 Codebase Refactoring
- **Unified DTO Handler:** Created `dtoHandler.js` to standardize parsing, markdown stripping, and error fallback (Defaults) across all AI providers (Gemini, Claude, DeepSeek).
- **Claude JSON Compliance:** Hardened Claude's system prompt and logic to strictly enforce valid JSON outputs and ignore conversational preamble.