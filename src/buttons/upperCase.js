/**
 * Upper Case Button
 * Converts text to uppercase
 */

import { createButton } from './createButton.js';

export function createUpperCaseButton(textarea) {
  const button = createButton('Upper Case', '120px', '32px', () => {
    textarea.value = textarea.value.toUpperCase();
  });

  return button;
}