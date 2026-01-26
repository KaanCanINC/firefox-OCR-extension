/**
 * Single Line Button
 * Converts multi-line text to single line with OCR corrections
 */

import { createButton } from './createButton.js';
import { applyManhwaCorrections } from './buttonFunctions.js';

export function createSingleLineButton(textarea) {
  const button = createButton('Single Line', '120px', '32px', () => {
    const correctedText = applyManhwaCorrections(textarea.value);
    textarea.value = correctedText.replace(/\n/g, ' ');
  });

  return button;
}