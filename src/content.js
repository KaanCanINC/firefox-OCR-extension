import { performOCR } from './ocr.js';
import { showPopup, updatePopup } from './popup.js';
import { createOverlay, updateOverlay, removeOverlay } from './overlay.js';
import { openSettingsPanel } from './settings.js';
import { createFloatingSettingsButton } from './buttons/settings.js';

console.log('Content script loaded');

// Create a floating settings button on bottom-left
try {
  createFloatingSettingsButton();
} catch (e) {
  console.warn('Could not create floating settings button:', e);
}

// Capture-phase interceptor: if a settings button is clicked, open our panel
document.addEventListener('click', (ev) => {
  try {
    const btn = ev.target.closest && ev.target.closest('button');
    if (!btn) return;
    const isSettings = btn.id === 'ocr-settings-fab' || btn.title === 'Settings' || btn.textContent.trim() === '⚙';
    if (!isSettings) return;

    // Prevent other handlers (including ones referencing chrome.tabs) from running
    ev.stopImmediatePropagation();
    ev.preventDefault();

    if (typeof openSettingsPanel === 'function') {
      console.log('Settings click intercepted — opening panel');
      openSettingsPanel();
      return;
    }
    window.dispatchEvent(new CustomEvent('ocr:openSettings'));
  } catch (e) {
    console.warn('Settings click interceptor error', e);
  }
}, true);

let isSelecting = false;
let startX, startY, endX, endY;
let selectionDiv;

browser.runtime.onMessage.addListener(async (message) => {
  console.log('Content script received message:', message);
  if (message.action === 'startSelection') {
    startSelection();
  }
});

function startSelection() {
  if (isSelecting) return;
  isSelecting = true;

  // Create overlay divs
  createOverlay();

  // Create selection overlay
  selectionDiv = document.createElement('div');
  selectionDiv.style.position = 'fixed';
  selectionDiv.style.border = '2px solid red';
  selectionDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
  selectionDiv.style.pointerEvents = 'none';
  selectionDiv.style.zIndex = '1000001';
  document.body.appendChild(selectionDiv);

  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}



function onMouseDown(e) {
  startX = e.clientX;
  startY = e.clientY;
  selectionDiv.style.left = startX + 'px';
  selectionDiv.style.top = startY + 'px';
  selectionDiv.style.width = '0px';
  selectionDiv.style.height = '0px';
}

function onMouseMove(e) {
  if (!isSelecting || startX === undefined) return;
  endX = e.clientX;
  endY = e.clientY;
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  selectionDiv.style.left = left + 'px';
  selectionDiv.style.top = top + 'px';
  selectionDiv.style.width = width + 'px';
  selectionDiv.style.height = height + 'px';
  updateOverlay(startX, startY, endX, endY);
}

async function onMouseUp(e) {
  if (!isSelecting) return;
  endX = e.clientX;
  endY = e.clientY;

  // Remove listeners and overlay first
  document.removeEventListener('mousedown', onMouseDown);
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  try {
    removeOverlay();
  } catch (err) {
    console.error('Error removing overlay:', err);
  }
  try {
    if (selectionDiv && document.body.contains(selectionDiv)) {
      document.body.removeChild(selectionDiv);
    }
  } catch (err) {
    console.error('Error removing selectionDiv:', err);
  }

  // Compute selection
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  if (width === 0 || height === 0) {
    isSelecting = false;
    startX = startY = endX = endY = undefined;
    return;
  }
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);

  try {
    // Ask background to capture visible tab as data URL
    const resp = await browser.runtime.sendMessage({ action: 'captureViewport' });
    if (!resp || !resp.dataUrl) throw new Error('No capture data received');

    const img = new Image();
    img.src = resp.dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // Crop taking devicePixelRatio into account
    const dpr = window.devicePixelRatio || 1;
    const sx = Math.round(left * dpr);
    const sy = Math.round(top * dpr);
    const sWidth = Math.round(width * dpr);
    const sHeight = Math.round(height * dpr);

    const canvas = document.createElement('canvas');
    canvas.width = sWidth;
    canvas.height = sHeight;
    const ctx = canvas.getContext('2d');

    // Ensure we don't read outside the image
    const srcW = Math.max(0, Math.min(sWidth, img.width - sx));
    const srcH = Math.max(0, Math.min(sHeight, img.height - sy));

    ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, canvas.width, canvas.height);

    // Show popup with processing
    const popup = showPopup('processing', '');

    // Perform OCR using shared module
    console.log('Starting OCR...');
    const extractedText = await performOCR(canvas);
    console.log('OCR result:', extractedText);

    // Update popup with result
    updatePopup(popup, extractedText);
  } catch (error) {
    console.error('OCR failed:', error);
    showPopup('done', 'OCR processing failed');
  }

  isSelecting = false;
  startX = startY = endX = endY = undefined;
}

function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
