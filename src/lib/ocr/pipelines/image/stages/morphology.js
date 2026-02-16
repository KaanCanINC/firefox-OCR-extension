import { getSafeImageData } from '../../../../../utils/image.js';

/**
 * Morphological Operations Stage
 * Implements Opening (Erosion -> Dilation) for binary images.
 * Assumes image is binary (0 or 255).
 * Treats Black (0) as the Foreground Object (Text/Lines).
 * @param {ImageData|HTMLCanvasElement} input Input image
 * @param {Object} options Configuration
 * @param {string} [options.type='open'] Type of operation
 * @param {number} [options.kernelSize=1] Size of kernel
 */
export function applyMorphology(input, options = {}) {
    const { type = 'open', kernelSize = 1 } = options;
    
    let current, width, height;

    if (input instanceof HTMLCanvasElement || (input && input.tagName === 'CANVAS')) {
        width = input.width;
        height = input.height;
        const ctx = input.getContext('2d');
        // Clean ImageData copy using utility
        const pixels = ctx.getImageData(0, 0, width, height);
        current = getSafeImageData(pixels);
    } else if (input instanceof ImageData || (input && input.data && input.width && input.height)) {
        // Create clean copy using utility
        if (!(input instanceof ImageData)) {
             current = new ImageData(new Uint8ClampedArray(input.data), input.width, input.height);
        } else {
             current = getSafeImageData(input);
        }
    } else {
        throw new Error("Invalid input type for morphology stage");
    }
    
    // 1. Erode (Shrink Black regions)
    // Pixel becomes White (255) if any neighbor is White.
    // Pixel stays Black (0) only if ALL neighbors are Black.
    
    if (type === 'open') {
        current = erode(current, kernelSize);
        current = dilate(current, kernelSize);
    }
    
    return current;
}

function erode(imageData, size) {
    const w = imageData.width;
    const h = imageData.height;
    const input = imageData.data;
    const output = new Uint8ClampedArray(input.length);
    output.fill(255); // Default White

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            // Check if pixel should be Black (Foreground)
            // It stays Black ONLY if all neighbors in kernel are Black.
            let allBlack = true;
            
            for (let ky = -size; ky <= size; ky++) {
                for (let kx = -size; kx <= size; kx++) {
                    const nx = x + kx;
                    const ny = y + ky;
                    
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        const idx = (ny * w + nx) * 4;
                        if (input[idx] > 128) { // If neighbor is White
                            allBlack = false;
                            break;
                        }
                    } else {
                        // Border handling: Assume White (Background) outside?
                        // If we assume White outside, then border pixels will erode (turn white).
                        // That helps removing border noise!
                        allBlack = false; 
                        break;
                    }
                }
                if (!allBlack) break;
            }

            if (allBlack) {
                const i = (y * w + x) * 4;
                output[i] = 0;
                output[i+1] = 0;
                output[i+2] = 0;
                output[i+3] = 255;
            } else {
                // Already filled 255
            }
        }
    }
    return new ImageData(output, w, h);
}

function dilate(imageData, size) {
    const w = imageData.width;
    const h = imageData.height;
    const input = imageData.data;
    const output = new Uint8ClampedArray(input.length);
    output.fill(255); // Default White

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            // Check if pixel should be Black (Foreground)
            // It becomes Black if ANY neighbor is Black.
            
            let anyBlack = false;
             for (let ky = -size; ky <= size; ky++) {
                for (let kx = -size; kx <= size; kx++) {
                    const nx = x + kx;
                    const ny = y + ky;
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        const idx = (ny * w + nx) * 4;
                        if (input[idx] < 128) {
                            anyBlack = true;
                            break;
                        }
                    }
                }
                if (anyBlack) break;
            }

            if (anyBlack) {
                const i = (y * w + x) * 4;
                output[i] = 0;
                output[i+1] = 0;
                output[i+2] = 0;
                output[i+3] = 255;
            }
        }
    }
    return new ImageData(output, w, h);
}