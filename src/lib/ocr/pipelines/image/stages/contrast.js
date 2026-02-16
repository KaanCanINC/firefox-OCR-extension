import { getSafeImageData } from '../../../../../utils/image.js';

/**
 * Contrast Enhancement Stage
 * Increases contrast dynamically based on image histogram while preserving whites.
 * @param {ImageData|HTMLCanvasElement} input Input image
 * @param {Object} options Configuration
 */
export async function applyContrast(input, options = {}) {
    let inputData, width, height;

    if (input instanceof HTMLCanvasElement || (input && input.tagName === 'CANVAS')) {
        width = input.width;
        height = input.height;
        const wrapped = input.getContext('2d').getImageData(0, 0, width, height);
        inputData = getSafeImageData(wrapped).data;
    } else if (input instanceof ImageData || (input && input.data && input.width && input.height)) {
        width = input.width;
        height = input.height;
        if (!(input instanceof ImageData)) {
             inputData = new Uint8ClampedArray(input.data);
        } else {
             inputData = getSafeImageData(input).data;
        }
    } else {
        throw new Error("Invalid input type for contrast stage");
    }
    
    // Copy data for manipulation (or just use inputData if we modify in place, but safer to output new)
    const outputData = new Uint8ClampedArray(inputData);
    
    // Calculate luminance histogram
    const histogram = new Array(256).fill(0);
    
    for (let i = 0; i < inputData.length; i += 4) {
        // Skip fully transparent pixels
        if (inputData[i + 3] === 0) continue;
        
        const r = inputData[i];
        const g = inputData[i + 1];
        const b = inputData[i + 2];
        
        // Perceptual luminance
        const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        histogram[Math.min(255, Math.max(0, lum))]++;
    }
    
    // Calculate CDF to find dynamic range
    const totalPixels = width * height;
    let cdf = 0;
    let minLum = 0;
    let maxLum = 255;
    
    // Find lower bound (ignoring bottom 1% of pixels)
    for (let i = 0; i < 256; i++) {
        cdf += histogram[i];
        if (cdf > totalPixels * 0.01) {
            minLum = i;
            break;
        }
    }
    
    // Find upper bound (ignoring top 1% of pixels)
    cdf = 0;
    for (let i = 255; i >= 0; i--) {
        cdf += histogram[i];
        if (cdf > totalPixels * 0.01) { // 1% from top
            maxLum = i;
            break;
        }
    }
    
    if (maxLum < 200) {
        maxLum = 255; 
    } else {
        maxLum = Math.max(maxLum, 240); 
    }

    const range = maxLum - minLum;
    if (range <= 0) return new ImageData(outputData, width, height);
    
    const scale = 255 / range;
    
    for (let i = 0; i < outputData.length; i += 4) {
        if (outputData[i + 3] === 0) continue;
        
        outputData[i] = Math.max(0, Math.min(255, (outputData[i] - minLum) * scale));
        outputData[i + 1] = Math.max(0, Math.min(255, (outputData[i + 1] - minLum) * scale));
        outputData[i + 2] = Math.max(0, Math.min(255, (outputData[i + 2] - minLum) * scale));
        // Alpha unchanged
    }
    
    return new ImageData(outputData, width, height);
}