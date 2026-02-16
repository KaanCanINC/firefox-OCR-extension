import { getSafeImageData } from '../../../utils/imageUtils.js';

/**
 * Grayscale Conversion Stage
 * Converts image to grayscale using luminance formula.
 * @param {ImageData|HTMLCanvasElement} input Input image
 */
export function applyGrayscale(input) {
    let inputData, width, height;

    try {
        if (input instanceof HTMLCanvasElement || (input && input.tagName === 'CANVAS')) {
            width = input.width;
            height = input.height;
            try {
                const ctx = input.getContext('2d');
                // Try catch for getImageData specifically
                const pixels = ctx.getImageData(0, 0, width, height);
                // Create a local copy of the data using robust utility
                inputData = getSafeImageData(pixels).data;
            } catch (e) {
                // Handle Firefox "Permission denied" or SecurityError
                console.error('Grayscale Stage: Failed to extract ImageData', e);
                return input; 
            }
        } else if (input instanceof ImageData || (input && input.data && input.width && input.height)) {
            width = input.width;
            height = input.height;
            // Create a local copy
            try {
                // If it looks like ImageData but isn't instanceof (e.g. wrapped), convert it
                if (!(input instanceof ImageData)) {
                    inputData = new Uint8ClampedArray(input.data);
                } else {
                    inputData = getSafeImageData(input).data;
                }
            } catch (e) {
                console.error('Grayscale Stage: Failed to copy ImageData', e);
                return input;
            }
        } else {
            console.warn("Invalid input type for grayscale stage:", input);
            return input; // Bypass
        }

        if (!inputData) return input; // Should be handled by catch above but safe check

        const outputData = new Uint8ClampedArray(inputData.length);

        for (let i = 0; i < inputData.length; i += 4) {
            // Luminance: 0.299R + 0.587G + 0.114B
            const avg = (0.299 * inputData[i] + 0.587 * inputData[i + 1] + 0.114 * inputData[i + 2]);
            outputData[i] = avg;     // R
            outputData[i + 1] = avg; // G
            outputData[i + 2] = avg; // B
            outputData[i + 3] = inputData[i + 3]; // Alpha
        }
        return new ImageData(outputData, width, height);
    } catch (err) {
        console.error("Grayscale critical error:", err);
        return input;
    }
}