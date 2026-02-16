// src/utils/levenshtein.js

/**
 * Calculates Levenshtein distance between two strings.
 * @param {string} a 
 * @param {string} b 
 * @returns {number} The edit distance
 */
export function getLevenshteinDistance(a, b) {
    return getLevenshteinAlgorithm(a, b);
}

/**
 * Finds the closest match in a dictionary.
 * @param {string} word The word to correct
 * @param {Set<string>|Array<string>} dictionary collection of valid words
 * @param {number} maxDistance Maximum allowed distance
 * @returns {string|null} Closest match or null
 */
export function findClosestMatch(word, dictionary, maxDistance = 2) {
    let closestWord = null;
    let minDistance = Infinity;

    // Convert Set to Array if needed
    const iterable = (dictionary instanceof Set) ? dictionary : dictionary;

    for (const dictWord of iterable) {
        // Optimization: Length difference must be within limit
        if (Math.abs(dictWord.length - word.length) > maxDistance) continue;
        
        // Exact match (should be caught earlier, but safety check)
        if (dictWord === word) return word;

        const distance = getLevenshteinAlgorithm(word, dictWord); // Use internal
        if (distance <= maxDistance && distance < minDistance) {
            minDistance = distance;
            closestWord = dictWord;
        }
    }

    return closestWord;
}

// Internal standard implementation
function getLevenshteinAlgorithm(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

// Export the simple function too
// export const getLevenshteinDistance = getLevenshteinAlgorithm;

