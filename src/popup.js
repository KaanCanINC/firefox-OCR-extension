/**
 * Popup Module
 * Handles displaying OCR results popup with progress and controls
 */

import { createButton, createPrimaryButton, createIconButton } from './buttons/createButton.js';
import { createButtonHandlers, createFeedbackHandler } from './buttons/buttonFunctions.js';
import { createLowerCaseButton } from './buttons/lowerCase.js';
import { createUpperCaseButton } from './buttons/upperCase.js';
import { createSingleLineButton } from './buttons/singleLine.js';
import { createManhwaModeButton } from './buttons/manhwaMode.js';
import { createCopyButton } from './buttons/copy.js';
import { createCloseButton } from './buttons/close.js';
import { createSettingsButton } from './buttons/settings.js';

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
  textareaWrap.appendChild(textarea);

  // Controls above textarea: language (left) and settings (right)
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.justifyContent = 'space-between';
  controls.style.alignItems = 'center';
  controls.style.marginBottom = '8px';

  const langSelectSmall = document.createElement('select');
  ['Korean','English','Turkish','Chinese'].forEach(opt=>{ const o=document.createElement('option'); o.value=o.textContent=opt; langSelectSmall.appendChild(o); });
  Object.assign(langSelectSmall.style, { background: '#0b1220', color: '#e6eef8', border: '1px solid #25303a', borderRadius: '6px', padding: '6px', fontSize: '12px' });

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

export function updatePopup(popup, text) {
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

  if (textarea) textarea.value = text;
  if (progressContainer) progressContainer.style.display = "none";
  if (textarea) textarea.style.display = "block";
  if (footer) footer.style.display = "flex";
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