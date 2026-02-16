import { cleanNoise } from './stages/noise.js';
import { applyRegexCorrections } from './stages/regex.js';
import { applyDictionaryCorrections } from './stages/dictionary.js';
import { applyUserRules } from './stages/user.js';
import { cleanManhwaText } from './stages/manhwa.js';
import { normalizeWhitespace } from './stages/normalize.js';
import { reconstructText } from './stages/reconstruct.js';

/**
 * Text Cleaning Pipeline
 * Orchestrates text processing stages. Each stage is modular and toggleable.
 * 
 * @param {string} text The raw OCR text
 * @param {Object} options Configuration object
 * @returns {string} Cleaned text
 */
export function processText(text, options = {}) {
    if (!text) return text;
    let currentText = text;

    // 1. Noise Cleaning (Removal of OCR artifacts)
    if (options.noiseCleaning !== false) {
        currentText = cleanNoise(currentText, { 
            noiseAggression: options.noiseAggression 
        });
    }

    // 1.5. Whitespace Normalization (New)
    if (options.normalizeText !== false) {
        currentText = normalizeWhitespace(currentText);
    }

    // 2. Regex Correction (Spacing and Punctuation Fixes)
    // Run regex before Manhwa?
    // Manhwa mode reconstructs spaced words. Regex fixes gaps.
    // If we run regex first, we might fix "H E L L O" -> "H E L L O"? No change.
    // If we fix "Word ." -> "Word."
    // Let's keep Manhwa early.

    if (options.manhwaMode === true) {
        currentText = cleanManhwaText(currentText);
    }
    
    // 3. Regex Correction (Standard)
    if (options.regexCorrection !== false) {
        currentText = applyRegexCorrections(currentText);
    }

    // 4. Dictionary Correction
    if (options.dictionaryCorrection === true) {
        currentText = applyDictionaryCorrections(currentText, { 
            ignoreAllCaps: options.dictionaryIgnoreCaps,
            dictionaryStrength: options.dictionaryStrength
        });
    }

    // 5. User Rules (Find/Replace, Deletions)
    // Always apply user rules if provided, unless explicitly disabled
    if (options.userRules !== false) {
        currentText = applyUserRules(currentText, {
            deletions: options.deletions,
            replacements: options.replacements
        });
    }

    // 6. Text Reconstruction (Line Merge & Stabilization)
    if (options.textReconstruction !== false) {
        currentText = reconstructText(currentText, { 
            mergeLines: options.reconstructMergeLines,
            stabilizeSentences: options.reconstructStabilize
        });
    }

    return currentText;
}