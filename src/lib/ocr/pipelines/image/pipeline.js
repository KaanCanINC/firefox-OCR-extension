import { applyImageResize } from './stages/resize.js';
import { applyContrast } from './stages/contrast.js';
import { applyGrayscale } from './stages/grayscale.js';
import { applyMedianBlur } from './stages/blur.js';
import { applyAdaptiveThreshold } from './stages/threshold.js';
import { applyMorphology } from './stages/morphology.js';
import { extractLargestWhiteRegion } from './stages/region.js';

/**
 * Advanced Image Processing Pipeline
 * Orchestrates sequential execution of processing stages.
 * Optimized for stylized manhwa speech bubbles.
 */

// Map stage names to functions for easy configuration
export const STAGES = {
    resize: applyImageResize,
    grayscale: applyGrayscale,
    contrast: applyContrast,
    blur: applyMedianBlur,
    threshold: applyAdaptiveThreshold,
    morphology: applyMorphology,
    region: extractLargestWhiteRegion
};

/**
 * Executes a defined pipeline on an image.
 * @param {ImageData|HTMLCanvasElement} input Input image
 * @param {Array<{stage: Function, options: Object}>} pipelineConfig Array of stage configurations
 * @returns {Promise<ImageData|HTMLCanvasElement>} Processed image
 */
export async function runPipeline(input, pipelineConfig) {
    let currentData = input;
    // Helper to get raw image for debug
    const getDebugImage = (data) => {
        if (data instanceof ImageData) return data;
        // if canvas, returns itself (reference)
        return data; 
    };

    for (const step of pipelineConfig) {
        try {
            if (typeof step === 'function') {
                currentData = await step(currentData);
            } else if (step && typeof step.stage === 'function') {
                currentData = await step.stage(currentData, step.options || {});
                
                // Debug Hook
                if (step.onComplete) {
                    step.onComplete(step.name || 'Stage', getDebugImage(currentData));
                }
            }
        } catch (e) {
            console.error(`Pipeline stage failed: ${step.name || (typeof step === 'function' ? step.name : 'unknown')}`, e);
            throw e;
        }
    }
    return currentData;
}

/**
 * helper to build default pipeline based on boolean flags (legacy support)
 */
function buildPipelineFromOptions(options) {
    const pipeline = [];
    // Helper for debug callback
    const onComplete = (name, data) => {
        if (options.debug && options.onStep) {
            options.onStep(name, data);
        }
    };
    
    // 1. Resize
    if (options.resize !== false) {
        pipeline.push({ 
            stage: applyImageResize, 
            options: { scale: options.scale || 2 }, 
            name: 'resize',
            onComplete 
        });
    }
    
    // 2. Grayscale
    if (options.grayscale) {
        pipeline.push({ stage: applyGrayscale, name: 'grayscale', onComplete });
    }

    // 3. Median Blur
    if (options.medianBlur) {
        pipeline.push({ stage: applyMedianBlur, name: 'blur', onComplete });
    }

    // 4. Contrast
    if (options.contrast) {
        pipeline.push({ stage: applyContrast, options: { val: options.contrastVal || 50 }, name: 'contrast', onComplete });
    }

    // 5. Adaptive Threshold
    if (options.adaptiveThreshold) {
        pipeline.push({ stage: applyAdaptiveThreshold, options: { blockSize: 15, constant: 10 }, name: 'threshold', onComplete });
    }

    // 6. Morphological Opening
    if (options.morphology) {
        pipeline.push({ stage: applyMorphology, options: { type: 'open', kernelSize: 1 }, name: 'morphology', onComplete });
    }

    // 7. Region Extraction
    if (options.removeBorders) {
        pipeline.push({ stage: extractLargestWhiteRegion, name: 'region', onComplete });
    }

    return pipeline;
}


export async function processImage(imageData, options = {}) {
    const pipeline = buildPipelineFromOptions(options);
    
    // Ensure input is acceptable by first stage (most handle both, but some might expect ImageData)
    // Actually our refactored stages handle both.
    
    // Determine return type? processImage traditionally returned ImageData.
    // If last stage returns Canvas, we should convert back to ImageData if caller expects it.
    // ocr.js expects ImageData.
    
    let result = await runPipeline(imageData, pipeline);
    
    if (result instanceof HTMLCanvasElement) {
        const ctx = result.getContext('2d');
        result = ctx.getImageData(0, 0, result.width, result.height);
    }
    
    return result;
}