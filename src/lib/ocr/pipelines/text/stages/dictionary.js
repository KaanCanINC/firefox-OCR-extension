import { dictionaryManager } from '../../../../../utils/dictionary.js';
import { findClosestMatch } from '../../../../../utils/levenshtein.js';

/**
 * Dictionary Correction Stage
 * Applies dictionary-based corrections to fix common spelling errors.
 * 
 * @param {string} text 
 * @param {Object} options 
 */
export function applyDictionaryCorrections(text, options = {}) {
    if (!text) return text;

    // Options mapping: 
    // allowAllCaps: boolean (default false -> ignore all caps words)
    // dictionaryStrength: number (max distance, e.g. 1 or 2)
    const ignoreAllCaps = options.ignoreAllCaps !== false; // default true in logic
    const maxDistance = options.dictionaryStrength || 1; 

    // Ensure dict is loaded
    // Note: Since this is synchronous pipeline, we must ensure dict is pre-loaded 
    // or loaded async before pipeline starts. 
    // However, if not loaded, we skip.
    if (!dictionaryManager.loaded) {
        // Warning: dictionary not loaded.
        return text;
    }

    const dict = dictionaryManager.get('eng'); 

    // Tokenize
    // We split by non-word characters to isolate words, but keep punctuation for reconstruction
    // Actually, simple regex replacement is safer to preserve structure.
    
    return text.replace(/[a-zA-Z]+/g, (word) => {
        // Skip small words
        if (word.length < 3) return word;

        // Skip All Caps if configured
        const isAllCaps = /^[A-Z]+$/.test(word);
        if (ignoreAllCaps && isAllCaps) return word;

        // Check exact match (case insensitive)
        if (dictionaryManager.has(word)) return word;

        // Attempt correction
        const corrected = findClosestMatch(word.toLowerCase(), dict, maxDistance);
        
        if (corrected) {
            // Restore case
            return matchCase(word, corrected);
        }

        return word;
    });
}

function matchCase(original, corrected) {
    if (original === original.toUpperCase()) return corrected.toUpperCase();
    if (original[0] === original[0].toUpperCase()) {
        return corrected.charAt(0).toUpperCase() + corrected.slice(1);
    }
    return corrected;
}