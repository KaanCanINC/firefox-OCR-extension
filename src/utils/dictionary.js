// src/utils/dictionary.js
/**
 * Dictionary Manager
 * Loads and manages dictionaries for spell checking.
 */
import { vocabulary } from './default_dict.js'; // This will contain a basic English dictionary

// A more complete dictionary can be loaded from file.
// For now, we seed with a basic set.
const DEFAULT_DICT = vocabulary;

class DictionaryManager {
    constructor() {
        this.dictionaries = new Map();
        this.loaded = false;
    }

    async load(lang = 'eng') {
        if (this.dictionaries.has(lang)) return;

        // In a real extension, we would load from a file or fetch it.
        // For now, we will use a bundled basic dictionary or load one dynamically.
        // Let's assume we have a basic English list.
        this.dictionaries.set('eng', new Set(DEFAULT_DICT));
        this.loaded = true;
    }

    has(word, lang = 'eng') {
        const dict = this.dictionaries.get(lang);
        if (!dict) return false;
        return dict.has(word.toLowerCase());
    }

    get(lang = 'eng') {
        return this.dictionaries.get(lang);
    }
}

export const dictionaryManager = new DictionaryManager();
