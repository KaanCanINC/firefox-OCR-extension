/**
 * OCR Module using bundled Tesseract.js
 * Handles text recognition from canvas images
 */

import { createWorker } from "tesseract.js";

/**
 * Performs OCR on a canvas element
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<string>}
 */
export async function performOCR(canvas) {
  try {
    const worker = await createWorker("eng");

    const {
      data: { text },
    } = await worker.recognize(canvas);
    await worker.terminate();

    return text ? text.trim() : "";
  } catch (error) {
    console.error("OCR processing failed:", error);
    throw error;
  }
}
