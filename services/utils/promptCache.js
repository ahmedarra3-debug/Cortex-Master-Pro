const fs = require('fs');
const path = require('path');

/**
 * 📚 [PROMPT CACHE v1.0] - In-Memory Cache for System Prompts
 * 
 * هدف الملف: منع تكرار قراءة ملفات الـ .txt من الـ filesystem في كل طلب
 * يحسن الأداء بنسبة كبيرة خاصة مع الطلبات المتكررة
 */

// Cache storage using Map for O(1) lookups
const promptCache = new Map();

/**
 * Reads a system prompt file with caching
 * @param {string} filePath - Absolute or relative path to the prompt file
 * @returns {string} The file content (UTF-8)
 */
function readPromptWithCache(filePath) {
    // Normalize path to ensure consistent cache keys
    const normalizedPath = path.resolve(filePath);
    
    // Check cache first
    if (promptCache.has(normalizedPath)) {
        console.log(`📚 [CACHE HIT]: Prompt loaded from cache: ${path.basename(normalizedPath)}`);
        return promptCache.get(normalizedPath);
    }
    
    // Cache miss - read from disk
    console.log(`📚 [CACHE MISS]: Reading prompt from disk: ${path.basename(normalizedPath)}`);
    try {
        const content = fs.readFileSync(normalizedPath, 'utf8');
        promptCache.set(normalizedPath, content);
        return content;
    } catch (error) {
        console.error(`❌ [CACHE ERROR]: Failed to read prompt file ${normalizedPath}:`, error.message);
        throw error;
    }
}

/**
 * Clear the entire prompt cache (useful for development/debugging)
 */
function clearPromptCache() {
    console.log(`🧹 [CACHE CLEAR]: Cleared ${promptCache.size} cached prompts`);
    promptCache.clear();
}

/**
 * Get cache statistics
 */
function getCacheStats() {
    return {
        size: promptCache.size,
        entries: Array.from(promptCache.keys()).map(key => path.basename(key))
    };
}

module.exports = {
    readPromptWithCache,
    clearPromptCache,
    getCacheStats
};