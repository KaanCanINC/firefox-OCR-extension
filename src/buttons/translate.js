/**
 * Translate Button
 * Translates captured text using Bing Translate API (via Background Script)
 */

import { createButton } from './createButton.js';
import { getSettings } from '../utils/settingsManager.js';


export function createTranslateButton(textarea) {
  const button = createButton('Translate', '120px', '32px');
  
  // Create a container for translation results if doesn't exist
  let resultDiv = null;

  button.handler = async () => {
    const text = textarea.value;
    if (!text.trim()) return false;

    // Get Settings
    const settings = await getSettings(['trans_src', 'trans_target', 'trans_style', 'trans_auto']);
    const from = settings.trans_auto ? null : (settings.trans_src === 'auto' ? null : settings.trans_src);
    const to = settings.trans_target || 'en';
    const style = settings.trans_style || 'below';

    try {
        console.log('[Content] Sending translation request to background...');
        // Send request to background
        const response = await browser.runtime.sendMessage({
            action: 'translate',
            text: text,
            from: from,
            to: to
        });

        console.log('[Content] Received response from background:', response);

        if (!response) {
            throw new Error('No response from background script');
        }

        if (response.error) {
            throw new Error(response.error + (response.details ? ': ' + response.details : ''));
        }

        if (!response.translatedText) {
            throw new Error('No translation text in response');
        }

        const translatedText = response.translatedText;

        // Always replace the textarea value with translation
        textarea.value = translatedText;

        return true;
    } catch (e) {
        console.error('Translation error:', e);
        alert('Translation failed: ' + e.message);
        return false;
    }
  };

  // Attach custom feedback behavior for translation
  button.addEventListener('click', async () => {
      const originalText = 'Translate';
      button.disabled = true;
      button.textContent = '...';
      
      try {
        const success = await button.handler();
        if (success) {
            button.textContent = 'Done!'; 
        } else {
            button.textContent = 'Failed';
        }
      } catch(e) {
          button.textContent = 'Error';
      } finally {
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 1500);
      }
  });

  return button;
}
