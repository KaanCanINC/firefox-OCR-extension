import { getSafeImageData } from '../../../../../utils/image.js';

/**
 * Adaptive Threshold Stage
 * Binarizes image using local mean calculated via Integral Image.
 * Optimizes readability for stylized text.
 * @param {ImageData|HTMLCanvasElement} input Input image
 * @param {Object} options Configuration
 * @param {number} [options.blockSize=15] Size of local neighborhood
 * @param {number} [options.constant=10] Constant subtracted from mean
 */
export function applyAdaptiveThreshold(input, options = {}) {
    const { blockSize = 15, constant = 10 } = options;

    let width, height, data;
    
    if (input instanceof HTMLCanvasElement || (input && input.tagName === 'CANVAS')) {
        width = input.width;
        height = input.height;
        const ctx = input.getContext('2d');
        // Copy to local
        data = getSafeImageData(ctx.getImageData(0, 0, width, height)).data;
    } else if (input instanceof ImageData || (input && input.data && input.width && input.height)) {
        width = input.width;
        height = input.height;
        // Copy to local
        if (!(input instanceof ImageData)) {
             data = new Uint8ClampedArray(input.data);
        } else {
             data = getSafeImageData(input).data;
        }
    } else {
        throw new Error("Invalid input type for threshold stage");
    }

    const output = new Uint8ClampedArray(data.length);

    // 1. Create Integral Image (Summed Area Table) for Grayscale channel (assuming R=G=B)
    // We already converted to grayscale, so reading R channel is sufficient.
    const integral = new Int32Array(width * height);

    // First row
    let sum = 0;
    for (let x = 0; x < width; x++) {
        sum += data[x * 4];
        integral[x] = sum;
    }

    // Rest
    for (let y = 1; y < height; y++) {
        sum = 0;
        for (let x = 0; x < width; x++) {
            sum += data[(y * width + x) * 4];
            integral[y * width + x] = integral[(y - 1) * width + x] + sum;
        }
    }

    // Helper to get sum of rect
    const getSum = (x1, y1, x2, y2) => {
        x1 = Math.max(0, x1);
        y1 = Math.max(0, y1);
        x2 = Math.min(width - 1, x2);
        y2 = Math.min(height - 1, y2);
        
        const A = (x1 > 0 && y1 > 0) ? integral[(y1 - 1) * width + (x1 - 1)] : 0;
        const B = (y1 > 0) ? integral[(y1 - 1) * width + y2] : 0; // Wait, formula is incorrect. 
        // Standard SAT: I(D) + I(A) - I(B) - I(C). D is bottom-right.
        // Let's stick to simple logic:
        // Sum(x1, y1, x2, y2) = I[y2, x2] - I[y1-1, x2] - I[y2, x1-1] + I[y1-1, x1-1]
        
        const D = integral[y2 * width + x2];
        const B_val = (y1 > 0) ? integral[(y1 - 1) * width + x2] : 0;
        const C_val = (x1 > 0) ? integral[y2 * width + (x1 - 1)] : 0;
        const A_val = (x1 > 0 && y1 > 0) ? integral[(y1 - 1) * width + (x1 - 1)] : 0;
        
        return D - B_val - C_val + A_val;
    };

    const halfBlock = Math.floor(blockSize / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            
            // Calculate local mean
            const x1 = x - halfBlock;
            const y1 = y - halfBlock;
            const x2 = x + halfBlock;
            const y2 = y + halfBlock;

            const count = (Math.min(width - 1, x2) - Math.max(0, x1) + 1) * 
                          (Math.min(height - 1, y2) - Math.max(0, y1) + 1);
            
            const sum = getSum(x1, y1, x2, y2);
            const mean = sum / count;

            // Threshold logic:
            // If pixel < mean - C ---> Foreground (Text/Black) -> 0
            // Else ---> Background (White) -> 255
            // Usually in speech bubbles, text is black on white.
            // Pixel value low = black.
            // If pixel is darker than local average by at least C, it's text.
            
            const val = data[idx];
            if (val < mean - constant) {
                output[idx] = 0;   // Black
                output[idx+1] = 0;
                output[idx+2] = 0;
            } else {
                output[idx] = 255; // White
                output[idx+1] = 255;
                output[idx+2] = 255;
            }
            output[idx+3] = 255; // Alpha opaque
        }
    }

    return new ImageData(output, width, height);
}