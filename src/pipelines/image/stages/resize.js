/**
 * Resize Image Stage
 * Resizes the image by 2x (or config scale) using high quality interpolation.
 *
 * @param {ImageData|HTMLCanvasElement} input The input image data or canvas
 * @param {Object} options Configuration object
 * @param {number} [options.scale=2] Scale factor
 * @returns {HTMLCanvasElement} The resized canvas
 */
export async function applyImageResize(input, options = {}) {
    const scale = options.scale || 2;
    
    let canvas, originalWidth, originalHeight;

    if (input instanceof ImageData) {
        originalWidth = input.width;
        originalHeight = input.height;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalWidth;
        tempCanvas.height = originalHeight;
        const ctx = tempCanvas.getContext('2d');
        try {
            ctx.putImageData(input, 0, 0);
        } catch (e) {
            try {
                // Fallback: Create compatible ImageData and copy
                const newInput = ctx.createImageData(input.width, input.height);
                // Efficient and Safe Deep Copy
                newInput.data.set(new Uint8ClampedArray(input.data));
                ctx.putImageData(newInput, 0, 0);
            } catch (e2) {
                console.error("Resize stage failed to process image data", e2);
                throw e2;
            }
        }
        canvas = tempCanvas;
    } else if (input instanceof HTMLCanvasElement) {
        canvas = input;
        originalWidth = canvas.width;
        originalHeight = canvas.height;
    } else {
        // Fallback or error
        throw new Error("Invalid input type for resizeStage");
    }

    const newWidth = originalWidth * scale;
    const newHeight = originalHeight * scale;

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = newWidth;
    outputCanvas.height = newHeight;
    const outputCtx = outputCanvas.getContext('2d');

    outputCtx.imageSmoothingEnabled = true;
    outputCtx.imageSmoothingQuality = 'high';
    outputCtx.drawImage(canvas, 0, 0, newWidth, newHeight);

    // Return ImageData instead of Canvas to avoid re-reading a potentially tainted canvas later
    try {
        return outputCtx.getImageData(0, 0, newWidth, newHeight);
    } catch (e) {
        // If resize tainted the canvas (e.g. via drawImage of tainted source), we can't extract.
        console.warn("Resize stage output tainted. Returning canvas reference (unsafe).", e);
        return outputCanvas;
    }
}