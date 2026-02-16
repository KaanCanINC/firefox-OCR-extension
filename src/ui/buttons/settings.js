/**
 * Settings Button
 * Settings icon button that opens settings page
 */

import { createIconButton } from './createButton.js';
import { openSettingsPanel } from '../../settings/main.js';

export function createSettingsButton() {
  const button = createIconButton('⚙', '32px', '32px');
  button.title = 'Settings';

  // Prefer the in-page panel if available; fall back safely.
  button.addEventListener('click', () => {
    try {
      if (typeof openSettingsPanel === 'function') {
        openSettingsPanel();
        return;
      }
    } catch (e) {
      // ignore
    }

    // If running in an extension page context that supports chrome.tabs, open settings.html
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.create === 'function') {
        chrome.tabs.create({ url: chrome.runtime.getURL('settings.html'), active: true });
        return;
      }
    } catch (e) {
      // ignore
    }

    // Last resort: dispatch a custom event so host page code can open the panel
    window.dispatchEvent(new CustomEvent('ocr:openSettings'));
  });

  return button;
}

export function createFloatingSettingsButton() {
  if (document.getElementById('ocr-settings-fab')) return document.getElementById('ocr-settings-fab');
  const btn = createSettingsButton();
  btn.id = 'ocr-settings-fab';
  btn.style.position = 'fixed';
  btn.style.left = '12px';
  btn.style.bottom = '12px';
  btn.style.zIndex = '1000002';
  btn.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
  btn.style.borderRadius = '8px';
  document.body.appendChild(btn);
  return btn;
}
