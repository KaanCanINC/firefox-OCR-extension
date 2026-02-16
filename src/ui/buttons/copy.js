/**
 * Copy Button
 * Copies text to clipboard with feedback
 */

import { createButton } from './createButton.js';
import { createFeedbackHandler } from './buttonFunctions.js';

export function createCopyButton(textarea, copyToClipboard) {
  const button = createButton('Copy', '120px', '32px');
  button.handler = async () => {
    await copyToClipboard(textarea.value);
    return true;
  };
  button.addEventListener('click', createFeedbackHandler(button, 'Copy'));

  return button;
}