// src/pipelines/text/stages/normalize.js
/**
 * Whitespace Normalization Stage
 * Cleans up spacing and punctuation usage.
 * @param {string} text Raw text
 * @param {Object} options Configuration
 */
export function normalizeWhitespace(text, options = {}) {
    if (!text) return text;

    let result = text;

    // 1. Convert multiple whitespace (including tabs/newlines if they are just formatting) to single space
    // Note: If we want to preserve paragraphs, we should handle \n\n differently.
    // For now, let's assume standard normalization: \s+ -> ' ' 
    // unless 'preserveNewlines' is true (future proof).
    result = result.replace(/[ \t]+/g, ' ');

    // 2. Normalize punctuation spacing
    // Remove space before: . , ! ? : ; ) ] }
    // Be careful with ellipsis ... (handled by regex usually)
    result = result.replace(/\s+([.,!?:;)}\]])/g, '$1');

    // Remove space after opening brackets: ( [ {
    result = result.replace(/([({[])\s+/g, '$1');

    // Ensure space after punctuation if followed by a letter or number (start of next word/sentence)
    // Avoids: "Hello.World" -> "Hello. World"
    // Exception: Decimals (0.5), URLs (http://), Acronyms (U.S.A. - ambiguous)
    // Safe rule: punctuation followed by letter
    result = result.replace(/([.,!?:;])([a-zA-Z])/g, '$1 $2');

    // 3. Trim
    result = result.trim();

    return result;
}
