
/**
 * Utilities for handling Image Data safely, avoiding Xray Wrapper issues in Firefox.
 */

// Helper to create a canvas (Offscreen if available, else DOM)
export function createSafeCanvas(width, height) {
    if (typeof OffscreenCanvas !== 'undefined') {
        return new OffscreenCanvas(width, height);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

/**
 * Creates a clean, safe copy of ImageData, stripping Xray wrappers if possible.
 * @param {ImageData} input 
 * @returns {ImageData}
 */
export function getSafeImageData(input) {
    // Relaxed check for Firefox Xray wrappers (Duck Typing)
    if (!input || typeof input !== 'object' || !('data' in input) || !('width' in input) || !('height' in input)) {
        console.error("Invalid input to getSafeImageData", input);
        throw new Error("Input must be ImageData (or have data/width/height)");
    }

    try {
        // Try structuredClone - best for Xrays as it serializes/deserializes
        return structuredClone(input);
    } catch (e) {
        // Fallback
    }

    try {
        // Try standard copy
        const copy = new Uint8ClampedArray(input.data);
        return new ImageData(copy, input.width, input.height);
    } catch (e) {
        // Fallback
    }
    
    try {
        // Try Slice (might work if constructor is blocked)
        const copy = input.data.slice(0); // For TypedArray, slice returns copy
        return new ImageData(copy, input.width, input.height);
    } catch (e) {
        console.error("Failed to clean ImageData", e);
        throw e;
    }
}
