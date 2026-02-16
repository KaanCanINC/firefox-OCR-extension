import { getSettings, saveSettings } from './settingsManager.js';

const DEFAULT_CONFIG = {
    tess_psm: '3', // Default to Auto (3) or specific block
    tess_oem: '1', // LSTM only
    tess_whitelist: '', // Empty means all
    tess_lang: 'eng',
    auto_psm: false // Feature flag for auto switching
};

class OCRConfigManager {
    constructor() {
        this.cache = { ...DEFAULT_CONFIG };
        this.listeners = [];
        this.loaded = false;
    }

    async load() {
        const keys = Object.keys(DEFAULT_CONFIG);
        const stored = await getSettings(keys);
        this.cache = { ...DEFAULT_CONFIG, ...stored };
        this.loaded = true;
        return this.cache;
    }

    get(key) {
        return this.cache[key];
    }

    async set(key, value) {
        this.cache[key] = value;
        await saveSettings({ [key]: value });
        this.notifyListeners();
    }
    
    // For bulk updates
    async setConfig(configObj) {
        this.cache = { ...this.cache, ...configObj };
        await saveSettings(configObj);
        this.notifyListeners();
    }

    onChange(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach(cb => cb(this.cache));
    }

    /**
     * Determines optimal PSM based on image dimensions and density.
     * @param {number} width 
     * @param {number} height 
     * @returns {string} Tesseract PSM code
     */
    getOptimalPSM(width, height) {
        if (!this.cache.auto_psm) {
            return this.cache.tess_psm;
        }

        const aspectRatio = width / height;
        
        // Logic:
        // Long horizontal strip (High AR) -> Likely single line -> PSM 7
        // Block/Paragraph (Low/Medium AR) -> Likely block -> PSM 6 or 3
        // Vertical strip (Very Low AR) -> Vertical text? (Manhwa often vertical) -> PSM 5?

        // Thresholds are heuristic
        if (aspectRatio > 3.0) {
            // Very wide: Single line
            return '7'; 
        } else if (aspectRatio < 0.2) {
            // Very tall: Vertical block
            return '5'; // Vertical text
        } else {
            // Standard block
            return '6'; // Assume uniform block of text
        }
    }
}

export const ocrConfig = new OCRConfigManager();
