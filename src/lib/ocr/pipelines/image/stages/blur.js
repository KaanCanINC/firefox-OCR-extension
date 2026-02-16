import { getSafeImageData } from '../../../../../utils/image.js';

/**
 * Median Blur Stage
 * Reduces noise while preserving edges.
 * Uses a 3x3 kernel.
 * @param {ImageData|HTMLCanvasElement} input Input image
 */
export function applyMedianBlur(input) {
    let inputData, width, height;

    if (input instanceof HTMLCanvasElement || (input && input.tagName === 'CANVAS')) {
        width = input.width;
        height = input.height;
        const wrapped = input.getContext('2d').getImageData(0, 0, width, height);
        inputData = getSafeImageData(wrapped).data;
    } else if (input instanceof ImageData || (input && input.data && input.width && input.height)) {
        width = input.width;
        height = input.height;
        // Duck typing safe check
        if (!(input instanceof ImageData)) {
             inputData = new Uint8ClampedArray(input.data);
        } else {
             inputData = getSafeImageData(input).data;
        }
    } else {
        throw new Error("Invalid input type for blur stage");
    }

    const output = new Uint8ClampedArray(inputData.length);
    output.fill(0);
    
    // Copy alpha channel and borders directly first
    output.set(inputData); 

    // Helper: Get pixel index
    const idx = (x, y) => (y * width + x) * 4;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i = idx(x, y);
            const r = [], g = [], b = [];

            // 3x3 Window
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const neighbor = idx(x + kx, y + ky);
                    r.push(inputData[neighbor]);
                    g.push(inputData[neighbor + 1]);
                    b.push(inputData[neighbor + 2]);
                }
            }

            // Sort and pick median (index 4)
            r.sort((a,b) => a-b);
            g.sort((a,b) => a-b);
            b.sort((a,b) => a-b);

            output[i] = r[4];
            output[i+1] = g[4];
            output[i+2] = b[4];
            // Alpha kept from copy
        }
    }

    return new ImageData(output, width, height);
}