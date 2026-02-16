/**
 * Popup Module
 * Handles displaying OCR results popup with progress and controls
 */

import { createButton, createPrimaryButton, createIconButton } from '../ui/buttons/createButton.js';
import { createButtonHandlers, createFeedbackHandler } from '../ui/buttons/buttonFunctions.js';
import { createLowerCaseButton } from '../ui/buttons/lowerCase.js';
import { createUpperCaseButton } from '../ui/buttons/upperCase.js';
import { createSingleLineButton } from '../ui/buttons/singleLine.js';
import { createManhwaModeButton } from '../ui/buttons/manhwaMode.js';
import { createCopyButton } from '../ui/buttons/copy.js';
import { createTranslateButton } from '../ui/buttons/translate.js';
import { createCloseButton } from '../ui/buttons/close.js';
import { createSettingsButton } from '../ui/buttons/settings.js';
import { getSettings } from '../utils/storage.js';

export function showPopup(state, text) {
  console.log("Showing popup with state:", state, "text:", text);

  // Remove any existing popups
  const existingPopups = document.querySelectorAll(
    'div[style*="position: fixed"][style*="bottom: 10px"][style*="right: 10px"]'
  );
  existingPopups.forEach((p) => {
    if (document.body.contains(p)) {
      document.body.removeChild(p);
    }
  });

  // Create popup container with dark theme styling
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.bottom = "10px";
  popup.style.right = "10px";
  popup.style.width = "min(450px, 90vw)";
  popup.style.backgroundColor = "#1f2937"; // dark background
  popup.style.color = "#f9fafb"; // light text
  popup.style.border = "1px solid #374151";
  popup.style.borderRadius = "12px";
  popup.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";
  popup.style.zIndex = "1000000";
  popup.style.fontFamily = "Inter, sans-serif";
  popup.style.padding = "20px";
  popup.style.maxHeight = "min(500px, 80vh)";
  popup.style.overflowY = "auto";

  // Progress bars
  const progressContainer = document.createElement("div");
  progressContainer.className = "progress-container";
  progressContainer.style.marginBottom = "20px";

  // Recognizing progress
  const recognizeDiv = document.createElement("div");
  recognizeDiv.style.display = "flex";
  recognizeDiv.style.alignItems = "center";

  const recognizeLabel = document.createElement("label");
  recognizeLabel.textContent = "Recognizing";
  recognizeLabel.style.width = "100px";
  recognizeLabel.style.fontSize = "14px";
  recognizeLabel.style.color = "#9ca3af";
  recognizeDiv.appendChild(recognizeLabel);

  const recognizeBar = document.createElement("div");
  recognizeBar.style.flex = "1";
  recognizeBar.style.height = "8px";
  recognizeBar.style.backgroundColor = "#374151";
  recognizeBar.style.borderRadius = "4px";
  recognizeBar.style.overflow = "hidden";

  const recognizeProgress = document.createElement("div");
  recognizeProgress.style.height = "100%";
  recognizeProgress.style.backgroundColor = "#4f46e5";
  recognizeProgress.style.width = "0%";
  recognizeBar.appendChild(recognizeProgress);
  recognizeDiv.appendChild(recognizeBar);
  progressContainer.appendChild(recognizeDiv);

  popup.appendChild(progressContainer);

  // Textarea wrapper so we can position language select and settings button
  const textareaWrap = document.createElement('div');
  textareaWrap.style.position = 'relative';
  textareaWrap.style.marginBottom = '18px';

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.width = "100%";
  textarea.style.height = "120px";
  textarea.style.padding = "12px";
  textarea.style.backgroundColor = "#374151";
  textarea.style.color = "#f9fafb";
  textarea.style.border = "1px solid #4b5563";
  textarea.style.borderRadius = "8px";
  textarea.style.resize = "vertical";
  textarea.style.fontFamily = "Inter, sans-serif";
  textarea.style.minHeight = "32px";
  textarea.style.maxHeight = "200px";
  
  // Prevent arrow keys from propagating to the page (Manhwa reader compatibility)
  textarea.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'PageUp', 'PageDown'].includes(e.code)) {
          e.stopPropagation();
          // We don't preventDefault, so the cursor moves in textarea.
      }
  });
  
  textareaWrap.appendChild(textarea);

  // Controls above textarea: language (left) and settings (right)
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.justifyContent = 'space-between';
  controls.style.alignItems = 'center';
  controls.style.marginBottom = '8px';

  const langSelectSmall = document.createElement('select');
  const langMap = {
    'English': 'eng',
    'Turkish': 'tur',
    'Korean': 'kor',
    'Chinese': 'chi_sim',
    'Japanese': 'jpn',
    'Spanish': 'spa',
    'French': 'fra',
    'German': 'deu',
    'Italian': 'ita',
    'Portuguese': 'por',
    'Russian': 'rus',
    'Arabic': 'ara'
  };
  
  // Populate language options
  Object.keys(langMap).forEach(name => {
    const o = document.createElement('option');
    o.value = langMap[name];
    o.textContent = name;
    langSelectSmall.appendChild(o);
  });
  
  Object.assign(langSelectSmall.style, { background: '#0b1220', color: '#e6eef8', border: '1px solid #25303a', borderRadius: '6px', padding: '6px', fontSize: '12px' });
  
  // Load current language setting
  getSettings(['tess_lang']).then(settings => {
    if (settings.tess_lang) {
      langSelectSmall.value = settings.tess_lang;
    }
  });
  
  // Save on change and re-run OCR
  langSelectSmall.addEventListener('change', async () => {
    const { saveSettings } = await import('../utils/storage.js');
    await saveSettings({ tess_lang: langSelectSmall.value });
    
    // Re-run OCR if data is available
    if (popup._ocrData) {
      const { performOCR } = await import('../lib/ocr/index.js');
      const { img, selections, dpr } = popup._ocrData;
      
      // Show loading state
      textarea.disabled = true;
      textarea.value = 'Re-analyzing with new language...';
      
      try {
        let combinedText = '';
        let combinedOriginal = '';
        
        for (const sel of selections) {
          const sx = Math.round(sel.x * dpr);
          const sy = Math.round(sel.y * dpr);
          const sWidth = Math.round(sel.width * dpr);
          const sHeight = Math.round(sel.height * dpr);
          
          if (sx + sWidth > img.width || sy + sHeight > img.height) continue;
          
          const canvas = document.createElement('canvas');
          canvas.width = sWidth;
          canvas.height = sHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
          
          const { text, originalText } = await performOCR(canvas);
          
          if (combinedText) combinedText += '\n\n';
          combinedText += text;
          
          if (combinedOriginal) combinedOriginal += '\n\n';
          combinedOriginal += originalText;
        }
        
        textarea.value = combinedText;
        textarea.disabled = false;
      } catch (e) {
        console.error('Re-OCR failed:', e);
        textarea.value = 'Error re-analyzing: ' + e.message;
        textarea.disabled = false;
      }
    }
  });

  const settingsBtn = createSettingsButton();
  Object.assign(settingsBtn.style, { width: '34px', height: '34px', padding: '6px', borderRadius: '6px', background: '#374151' });
  settingsBtn.title = 'Settings';

  controls.appendChild(langSelectSmall);
  controls.appendChild(settingsBtn);

  textareaWrap.appendChild(controls);
  textareaWrap.appendChild(textarea);
  popup.appendChild(textareaWrap);

  // Footer buttons (centered)
  const footer = document.createElement("div");
  footer.className = "popup-footer";
  footer.style.display = "flex";
  footer.style.justifyContent = 'center';
  footer.style.alignItems = "center";
  footer.style.gap = "0";
  footer.style.padding = '0';
  footer.style.margin = '0';
  footer.style.width = '100%';

  // Button container
  const buttonContainer = document.createElement("div");
  buttonContainer.style.display = "flex";
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.gap = "8px";
  buttonContainer.style.flexWrap = "wrap";
  buttonContainer.style.margin = '0';
  buttonContainer.style.padding = '0';
  buttonContainer.style.width = '100%';
  buttonContainer.style.boxSizing = 'border-box';

  // Create buttons using individual button modules
  const lowerBtn = createLowerCaseButton(textarea);
  buttonContainer.appendChild(lowerBtn);

  const upperBtn = createUpperCaseButton(textarea);
  buttonContainer.appendChild(upperBtn);

  const singleBtn = createSingleLineButton(textarea);
  buttonContainer.appendChild(singleBtn);

  const manhwaBtn = createManhwaModeButton(textarea);
  buttonContainer.appendChild(manhwaBtn);

  const copyBtn = createCopyButton(textarea, copyToClipboard);
  buttonContainer.appendChild(copyBtn);
  
  const translateBtn = createTranslateButton(textarea);
  buttonContainer.appendChild(translateBtn);

  // Apply visibility settings
  getSettings(['popup_hidden_buttons']).then(settings => {
      const hidden = settings.popup_hidden_buttons || [];
      if (hidden.includes('Lowercase')) lowerBtn.style.display = 'none';
      if (hidden.includes('Uppercase')) upperBtn.style.display = 'none';
      if (hidden.includes('Single Line')) singleBtn.style.display = 'none';
      if (hidden.includes('Manhwa Mode')) manhwaBtn.style.display = 'none';
      if (hidden.includes('Copy')) copyBtn.style.display = 'none';
      if (hidden.includes('Translate')) translateBtn.style.display = 'none';
  });

  const closeBtn = createCloseButton(popup);
  buttonContainer.appendChild(closeBtn);

  // Helper: check whether action should copy result (reads DOM checkbox or fallbacks to localStorage)
  function shouldCopyFor(actionName) {
    const id = `copy_${actionName.replace(/\s+/g,'_').toLowerCase()}`;
    const el = document.getElementById(id);
    if (el) return !!el.checked;
    try { const cfg = JSON.parse(localStorage.getItem('copyConfig') || '{}'); return !!cfg[id]; } catch (e) { return false; }
  }

  // Attach post-action copy behavior so main action runs first
    // Attach post-action copy behavior so main action runs first and show feedback
    lowerBtn.addEventListener('click', async () => { if (shouldCopyFor('Lowercase')) { if (await copyToClipboard(textarea.value)) showCopiedToast(); } });
    upperBtn.addEventListener('click', async () => { if (shouldCopyFor('Uppercase')) { if (await copyToClipboard(textarea.value)) showCopiedToast(); } });
    singleBtn.addEventListener('click', async () => { if (shouldCopyFor('Single Line')) { if (await copyToClipboard(textarea.value)) showCopiedToast(); } });
    manhwaBtn.addEventListener('click', async () => { if (shouldCopyFor('Manhwa Mode')) { if (await copyToClipboard(textarea.value)) showCopiedToast(); } });
    translateBtn.addEventListener('click', async () => { if (shouldCopyFor('Translate')) { if (await copyToClipboard(textarea.value)) showCopiedToast(); } });

  footer.appendChild(buttonContainer);
  popup.appendChild(footer);

  // Copy feedback small toast
  function showCopiedToast() {
    const t = document.createElement('div');
    t.textContent = 'Copied!';
    Object.assign(t.style, { position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: '#0b1220', color: '#e6eef8', padding: '6px 10px', borderRadius: '6px', border: '1px solid #25303a', zIndex: 1000002, opacity: '0', transition: 'opacity 160ms ease' });
    popup.appendChild(t);
    requestAnimationFrame(()=> t.style.opacity = '1');
    setTimeout(()=>{ t.style.opacity = '0'; setTimeout(()=> t.remove(), 220); }, 900);
  }

  // Set visibility based on state
  if (state === "processing") {
    progressContainer.style.display = "block";
    textarea.style.display = "none";
    footer.style.display = "none";
    // Start progress animation
    popup.intervalId = setInterval(() => {
      let current = parseFloat(recognizeProgress.style.width) || 0;
      current += 10;
      if (current > 90) current = 90;
      recognizeProgress.style.width = current + "%";
    }, 300);
  } else {
    progressContainer.style.display = "none";
    textarea.style.display = "block";
    footer.style.display = "flex";
  }

  document.body.appendChild(popup);

  return popup;
}

export function updatePopup(popup, text, originalText) {
  if (popup.intervalId) {
    clearInterval(popup.intervalId);
    const progressBar = popup.querySelector(
      'div[style*="backgroundColor: rgb(79, 70, 229)"]'
    );
    if (progressBar) progressBar.style.width = "100%";
  }

  const textarea = popup.querySelector("textarea");
  const progressContainer = popup.querySelector(".progress-container");
  const footer = popup.querySelector(".popup-footer");

  // Save texts on the popup element for reference
  popup.dataset.finalText = text;
  popup.dataset.originalText = originalText || text;

  if (textarea) textarea.value = text;
  if (progressContainer) progressContainer.style.display = "none";
  if (textarea) textarea.style.display = "block";
  if (footer) footer.style.display = "flex";

  // Add Diff View Toggle
  const controls = popup.querySelector('div[style*="justify-content: space-between"]');
  if (controls && !popup.querySelector('#btn-diff')) {
     const diffBtn = document.createElement('button');
     diffBtn.id = 'btn-diff';
     diffBtn.textContent = 'Original';
     diffBtn.title = 'Show Original Text for Restoration';
     Object.assign(diffBtn.style, {
         border: '1px solid #374151', background: '#1f2937', color: '#9ca3af',
         borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', marginLeft: 'auto', marginRight: '8px'
     });
     
     // Insert before settings button
     const settingsBtn = controls.lastElementChild;
     controls.insertBefore(diffBtn, settingsBtn);

     let diffMode = false;
     const originalContainer = document.createElement('div');
     originalContainer.style.display = 'none'; // Hidden by default
     originalContainer.style.marginBottom = '10px';
     originalContainer.style.padding = '8px';
     originalContainer.style.background = '#111827';
     originalContainer.style.border = '1px dashed #6366f1';
     originalContainer.style.borderRadius = '6px';
     originalContainer.style.fontSize = '12px';
     originalContainer.style.color = '#9ca3af';
     originalContainer.style.maxHeight = '80px';
     originalContainer.style.overflowY = 'auto';
     
     // Insert container before textarea
     textarea.parentElement.insertBefore(originalContainer, textarea);

     diffBtn.addEventListener('click', () => {
         diffMode = !diffMode;
         if (diffMode) {
             diffBtn.style.background = '#4f46e5';
             diffBtn.style.color = '#fff';
             
             // Populate Original Text View
             originalContainer.innerHTML = '';
             originalContainer.style.display = 'block';
             
             const raw = popup.dataset.originalText || '';
             // Tokenize by spaces/newlines to make clicking easier
             // Simple split?
             const parts = raw.split(/(\s+)/); // Keep delimiters
             
             parts.forEach(part => {
                 const span = document.createElement('span');
                 span.textContent = part;
                 if (part.trim().length > 0) {
                     span.style.cursor = 'pointer';
                     span.style.borderBottom = '1px dotted #6366f1';
                     span.title = 'Click to insert into text';
                     span.onmouseover = () => span.style.color = 'white';
                     span.onmouseout = () => span.style.color = '#9ca3af';
                     
                     span.onclick = () => {
                         // Insert text at cursor pos in textarea
                         const start = textarea.selectionStart;
                         const end = textarea.selectionEnd;
                         const val = textarea.value;
                         const before = val.substring(0, start);
                         const after = val.substring(end);
                         
                         textarea.value = before + part + after;
                         textarea.selectionStart = textarea.selectionEnd = start + part.length;
                         textarea.focus();
                     };
                 }
                 originalContainer.appendChild(span);
             });

             // Shrink textarea slightly?
             textarea.style.height = '80px';

         } else {
             diffBtn.style.background = '#1f2937';
             diffBtn.style.color = '#9ca3af';
             originalContainer.style.display = 'none';
             textarea.style.height = '120px';
         }
     });
  }
}

async function copyToClipboard(text) {
  try {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn('Modern clipboard API failed, falling back to execCommand');
  }

  // Fallback to execCommand
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch (e) {
    console.error('Clipboard copy failed:', e);
    return false;
  }
}