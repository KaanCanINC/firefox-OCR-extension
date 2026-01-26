/**
 * Close Button
 * Closes the popup
 */

import { createPrimaryButton } from './createButton.js';

export function createCloseButton(popup) {
  const button = createPrimaryButton('Close', '120px', '32px', () => {
    document.body.removeChild(popup);
  });

  return button;
}