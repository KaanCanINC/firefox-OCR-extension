/**
 * User Rules Stage
 * Applies user-defined Find & Replace and Character Deletion rules.
 */

function escapeRegExp(string) {
    if (typeof string !== 'string') return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function applyUserRules(text, config = {}) {
    if (!text) return text;
    let processed = text;
    
    // Safety check for array existence
    const deletions = Array.isArray(config.deletions) ? config.deletions : [];
    const replacements = Array.isArray(config.replacements) ? config.replacements : [];

    // --- 1. Enhanced Character Deletion Engine ---
    // Remove specific characters unless they are part of valid context (numbers, words)
    if (deletions.length > 0) {
        deletions.forEach(rule => {
             // Normalized rule structure
             let char, ignoreLetters, ignoreNumbers, ignoreWords;
             
             if (typeof rule === 'object' && rule !== null) {
                 char = rule.char;
                 if (!char) return;
                 // Active if explicitly true
                 ignoreLetters = rule.ignoreBetweenLetters === true;
                 ignoreNumbers = rule.ignoreBetweenNumbers === true;
                 ignoreWords = rule.ignoreInsideWords === true;
             } else if (typeof rule === 'string') {
                 // Legacy: simple char deletion
                 char = rule;
                 ignoreLetters = false;
                 ignoreNumbers = false;
                 ignoreWords = false;
             } else {
                 return;
             }

             // Optimization: If no context protection, use fast global replace
             if (!ignoreLetters && !ignoreNumbers && !ignoreWords) {
                 processed = processed.split(char).join('');
                 return;
             }

             // Context-Aware Logic
             const escaped = escapeRegExp(char);
             const re = new RegExp(escaped, 'g');
             
             processed = processed.replace(re, (match, offset, string) => {
                 const prev = string[offset - 1] || '';
                 const next = string[offset + match.length] || '';
                 
                 const prevIsLetter = /[a-zA-Z\u00C0-\u00FF]/.test(prev); // Basic Latin + Accents
                 const nextIsLetter = /[a-zA-Z\u00C0-\u00FF]/.test(next);
                 const prevIsDigit = /[0-9]/.test(prev);
                 const nextIsDigit = /[0-9]/.test(next);

                 // Check protection rules
                 if (ignoreLetters && prevIsLetter && nextIsLetter) return match; // e.g. "word-word" vs "-word"
                 if (ignoreNumbers && prevIsDigit && nextIsDigit) return match;   // e.g. "1.5" vs ".5"
                 if (ignoreWords && (prevIsLetter || prevIsDigit) && (nextIsLetter || nextIsDigit)) return match;

                 return ''; // Delete
             });
        });
    }
    
    // --- 2. Advanced Find & Replace Engine ---
    // Sequential application of replacement rules
    if (replacements.length > 0) {
        replacements.forEach(rule => {
            // Check if rule is enabled (default true if undefined for backward compat, but new UI sets explicit bool)
            if (rule.enabled === false) return;
            if (!rule.find) return; 

            // OCR Correction Mode: currently treated as standard replace. 
            // Feature hook: If we had confidence scores per word, we could use this flag 
            // to only replace low-confidence matches. For now, it's a semantic tag or just standard replace.

            try {
                let patternSource = rule.find;
                let flags = 'g';
                if (!rule.caseSensitive) flags += 'i';

                let re;

                if (rule.isRegex) {
                     // Direct Regex
                     re = new RegExp(patternSource, flags);
                } else {
                     // Literal Text
                     let escaped = escapeRegExp(patternSource);
                     
                     if (rule.wholeWord) {
                         // Intelligent whole word boundary
                         // Check if pattern is bounded by word characters
                         // \b handles most cases, but for special symbols it might fail.
                         // Using lookarounds could be safer but staying simple with \b is standard.
                         // However, avoid double \b if user typed matched boundaries? No, user types literal.
                         
                         // Determine boundary need based on start/end char type
                         const startWord = /\w/.test(patternSource[0]);
                         const endWord = /\w/.test(patternSource[patternSource.length - 1]);
                         
                         if (startWord) escaped = `\\b${escaped}`;
                         if (endWord) escaped = `${escaped}\\b`;
                     }
                     re = new RegExp(escaped, flags);
                }
                
                // Execute Replace
                const replacement = rule.replace || '';
                processed = processed.replace(re, replacement);

            } catch (e) {
                console.warn(`Text Processing: Invalid regex rule "${rule.find}"`, e);
            }
        });
    }

    return processed;
}
