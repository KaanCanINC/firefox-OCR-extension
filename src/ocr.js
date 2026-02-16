/**
 * OCR Module
 * Orchestrates Image Processing -> Tesseract OCR -> Text Processing
 */

import { createWorker } from "tesseract.js";
import { processImage } from "./pipelines/image/pipeline.js";
import { processText } from "./pipelines/text/pipeline.js";
import { getEffectiveRules, getSettings } from "./utils/settingsManager.js";
import { ocrConfig } from "./utils/ocrConfig.js";
import { debugViewer } from "./ui/debugViewer.js";
import { getSafeImageData, createSafeCanvas } from "./utils/imageUtils.js";

/**
 * Performs OCR and all pipeline stages
 * @param {HTMLCanvasElement} canvas The captured image canvas
 * @param {Object} options Optional overrides for pipeline settings
 * @returns {Promise<{text: string, originalText: string, confidence: number}>}
 */
export async function performOCR(canvas, options = {}) {
  try {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 1. Get Image Data (Critical Step)
    let imageData;
    try {
        const rawImageData = ctx.getImageData(0, 0, width, height);
        // Immediately sanitize
        imageData = getSafeImageData(rawImageData);
    } catch (e) {
        if (e.name === 'SecurityError' || e.message.includes('insecure')) {
            console.warn('Canvas tainted. Attempting workaround via data URL.');
            // Last resort: If canvas is tainted, we might be able to create a clean one via data URL loop?
            // Actually, if it's tainted, we can't extract data.
            // But if the source *was* a data URL (from background), maybe recreate it?
            // Since we don't have the source URL here easily, we fail.
            // However, maybe we can try to use the canvas even if tainted? No, OCR needs pixel data.
            throw new Error('Canvas tainted. Cannot extract image data for OCR.');
        }
        throw e;
    }

    // 2. Load Configuration
    await ocrConfig.load();
    const settings = await getSettings([
        'tess_lang',
        'preprocess_resize', 'preprocess_grayscale', 'preprocess_contrast', 
        'preprocess_blur', 'preprocess_threshold', 'preprocess_morphology', 'preprocess_borders',
        'debug_mode',
        // Text cleaning settings
        'clean_noise', 'noise_aggression',
        'clean_normalize', // Normalize spaces
        'clean_regex', 
        'clean_dict', 'dict_strength', 'dict_ignore_caps',
        'clean_user', 'manhwa_mode',
        'reconstruct_text', 'reconstruct_merge', 'reconstruct_stabilize' // Reconstruction
    ]);
    
    // Debug Mode Check
    const debugMode = settings.debug_mode === true;
    if (debugMode) {
        debugViewer.show();
        debugViewer.clear();
        debugViewer.addStep('Original', canvas);
    }
    
    const imageOptions = {
        resize: settings.preprocess_resize !== false, // Default true
        grayscale: settings.preprocess_grayscale !== false, // Default true for Manhwa
        contrast: settings.preprocess_contrast !== false,
        medianBlur: settings.preprocess_blur !== false,
        adaptiveThreshold: settings.preprocess_threshold !== false,
        morphology: settings.preprocess_morphology !== false,
        removeBorders: settings.preprocess_borders !== false,
        debug: debugMode,
        onStep: (name, image) => debugViewer.addStep(name, image),
        ...options.image // Allow overrides
    };
    
    // 3. Run Image Pipeline
    const processedImageData = await processImage(imageData, imageOptions);

    // 4. Prepare for Tesseract
    const processCanvas = document.createElement('canvas');
    if (processedImageData instanceof ImageData) {
        processCanvas.width = processedImageData.width;
        processCanvas.height = processedImageData.height;
        const pCtx = processCanvas.getContext('2d');
        try {
            pCtx.putImageData(processedImageData, 0, 0);
        } catch (e) {
            try {
                // Fallback: Use centralized safe cleaner
                const safeImg = getSafeImageData(processedImageData);
                pCtx.putImageData(safeImg, 0, 0);
            } catch (e2) {
                console.error("Critical: Failed to process image data config for OCR engine", e2);
                throw e2; 
            }
        }
    } else if (processedImageData instanceof HTMLCanvasElement) {
         // If pipeline returned a canvas (e.g. from resize fallback), use it directly
         processCanvas.width = processedImageData.width;
         processCanvas.height = processedImageData.height;
         const pCtx = processCanvas.getContext('2d');
         try {
            pCtx.drawImage(processedImageData, 0, 0);
         } catch(e) {
             // If drawImage fails (e.g. tainted input canvas), we can't extract pixels
             console.error("Critical: Failed to draw processed canvas to Tesseract input", e);
             throw e;
         }
    } else {
         console.warn("Pipeline returned unknown object.");
         try {
             // Try to use original imagedata
            processCanvas.width = width;
            processCanvas.height = height;
            processCanvas.getContext('2d').putImageData(imageData, 0, 0);     
         } catch (e) {
             // Fallback
             console.error("Critical: Failed to fallback to original image", e);
             throw e;
         }
    }

    // 5. Run Tesseract with Config
    const lang = options.lang || settings.tess_lang || 'eng';
    // Initialize worker with explicit language
    const worker = await createWorker(lang);
    
    // Determine PSM
    let psm = 3; // Default
    try {
        if(ocrConfig && ocrConfig.getOptimalPSM) {
             psm = ocrConfig.getOptimalPSM(width, height);
        }
    } catch(e) { console.warn('Config PSM failed', e); }
    
    // Apply Tesseract Parameters
    await worker.setParameters({
        tessedit_pageseg_mode: psm,
    });

    // Recognize
    let result = { data: { text: '', confidence: 0 }};
    try {
         // Pass canvas directly. If tainted, Tesseract.js might fail to read pixels.
         // However, Tesseract.js (v5) runs in worker and takes ImageData or Canvas.
         // If canvas is tainted, browser blocks `getImageData`. 
         // If we pass canvas element, Tesseract.js tries `getImageData` internally.
         // So we MUST ensure `processCanvas` is clean. 
         // `putImageData` makes it clean. `drawImage` of tainted makes it tainted.
         result = await worker.recognize(processCanvas);
    } catch (e) {
        console.error("Tesseract recognition failed", e);
        throw e;
    } finally {
        await worker.terminate();
    }

    const { data: { text, confidence } } = result;


    const rawText = text ? text.trim() : "";
    
    // 5. Run Text Pipeline
    // Determine scope
    let scope = 'global';
    try {
      const origin = window.location.origin;
      if (origin && origin !== 'null') {
        scope = `site:${origin}`;
      }
    } catch (e) { console.warn('Could not determine origin for rules scope'); }

    // Load rules
    const rules = await getEffectiveRules(scope);
    
    const textOptions = {
        noiseCleaning: settings.clean_noise !== false,
        noiseAggression: settings.noise_aggression || 'medium',
        
        normalizeText: settings.clean_normalize !== false, // Normalize Whitespace (Enabled)
        textReconstruction: settings.reconstruct_text === true,
        reconstructMergeLines: settings.reconstruct_merge !== false,
        reconstructStabilize: settings.reconstruct_stabilize !== false,

        regexCorrection: settings.clean_regex !== false,
        
        dictionaryCorrection: settings.clean_dict === true, 
        dictionaryStrength: settings.dict_strength !== undefined ? settings.dict_strength : 1,
        dictionaryIgnoreCaps: settings.dict_ignore_caps !== false,
        
        userRules: settings.clean_user !== false,
        replacements: rules.replacements,
        deletions: rules.deletions,
        
        manhwaMode: settings.manhwa_mode === true,
        ...options // Allow overriding behavior
    };

    const cleanText = processText(rawText, textOptions);

    return {
        text: cleanText,
        originalText: rawText,
        confidence: confidence
    };

  } catch (error) {
    console.error("OCR/Pipeline processing failed:", error);
    throw error;
  }
}