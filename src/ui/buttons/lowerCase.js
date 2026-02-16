/**
 * Lower Case Button
 * Converts text to lowercase with OCR corrections
 */

import { createButton } from './createButton.js';
import { applyManhwaCorrections } from './buttonFunctions.js';

export function createLowerCaseButton(textarea) {
  const button = createButton('Lower Case', '120px', '32px', () => {
    const correctedText = applyManhwaCorrections(textarea.value);
    textarea.value = correctedText.toLowerCase();
  });

  return button;
}