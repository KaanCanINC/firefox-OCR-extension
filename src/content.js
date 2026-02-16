import { performOCR } from './ocr.js';
import { showPopup, updatePopup } from './popup.js';
import { createOverlay, updateOverlay, removeOverlay } from './overlay.js';
import { openSettingsPanel } from './settings.js';
import { createFloatingSettingsButton } from './buttons/settings.js';
import { getSettings } from './utils/settingsManager.js';

console.log('Content script loaded');

// Manage Floating Button Visibility
async function updateFloatingButton() {
    const settings = await getSettings(['floating_button_enabled', 'floating_button_mode', 'floating_button_blacklist', 'floating_button_whitelist']);
    const enabled = settings.floating_button_enabled !== false;
    const mode = settings.floating_button_mode || 'blacklist';
    const blacklist = settings.floating_button_blacklist || [];
    const whitelist = settings.floating_button_whitelist || [];
    
    // Check list matching
    const currentUrl = window.location.href;
    const isMatch = (pattern) => {
        try {
            if (pattern.startsWith('/') && pattern.endsWith('/')) {
                return new RegExp(pattern.slice(1, -1)).test(currentUrl);
            }
            return currentUrl.includes(pattern);
        } catch (e) { return false; }
    };

    let allowed = enabled;

    if (enabled) {
        if (mode === 'blacklist') {
            // Allowed everywhere unless on blacklist
            if (blacklist.some(isMatch)) allowed = false;
        } else {
            // Blocked everywhere unless on whitelist
            allowed = false;
            if (whitelist.some(isMatch)) allowed = true;
        }
    }

    const shouldShow = allowed;
    const existingBtn = document.getElementById('ocr-settings-fab');

    if (shouldShow) {
        if (!existingBtn) {
            try {
                createFloatingSettingsButton();
            } catch (e) { console.warn('Button creation failed', e); }
        } else {
            existingBtn.style.display = 'flex';
        }
    } else {
        if (existingBtn) {
            existingBtn.style.display = 'none';
        }
    }
}

// Initial check
updateFloatingButton();

// Listen for updates
browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.floating_button_enabled || changes.floating_button_blacklist)) {
        updateFloatingButton();
    }
});

// Capture-phase interceptor: if a settings button is clicked, open our panel
document.addEventListener('click', (ev) => {
  try {
    const btn = ev.target.closest && ev.target.closest('button');
    if (!btn) return;
    const isSettings = btn.id === 'ocr-settings-fab' || btn.title === 'Settings' || btn.textContent.trim() === '⚙';
    if (!isSettings) return;

    // Prevent other handlers
    ev.stopImmediatePropagation();
    ev.preventDefault();

    if (typeof openSettingsPanel === 'function') {
      openSettingsPanel();
      return;
    }
    window.dispatchEvent(new CustomEvent('ocr:openSettings'));
  } catch (e) {
    console.warn('Settings click interceptor error', e);
  }
}, true);

let isSelecting = false;
let isDragging = false;
let startX, startY, endX, endY;
let multiSelectMode = false;
let selectionQueue = []; // array of {x,y,width,height}
let toolbarDiv = null;

browser.runtime.onMessage.addListener(async (message) => {
  console.log('Content script received message:', message);
  if (message.action === 'startSelection') {
    const settings = await getSettings(['enable_multiselect']);
    // If setting is disabled, force multiSelectMode to false and hide toggle? 
    // Or just default to false (which it is)
    // Requirement: "Feature must be optional and disabled by default"
    // I will use this setting to determine if the toggle should be SHOWN.
    startSelection(settings.enable_multiselect === true);
  }
});

function startSelection(allowMultiSelect) {
  if (isSelecting) return;
  isSelecting = true;
  selectionQueue = [];

  // Create overlay (canvas)
  const canvas = createOverlay();
  
  // Attach listeners to canvas to block interaction with page elements underneath
  canvas.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  window.addEventListener('keydown', onKeyDown);
  
  createSelectionToolbar(allowMultiSelect);
}

function createSelectionToolbar(allowMultiSelect) {
    if (toolbarDiv) toolbarDiv.remove();
    toolbarDiv = document.createElement('div');
    Object.assign(toolbarDiv.style, {
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: '#1f2937', padding: '10px 16px', borderRadius: '8px',
        display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: '1000002', color: '#f9fafb', fontFamily: 'Inter, sans-serif'
    });
    
    // Multi mode toggle
    if (allowMultiSelect) {
        const toggleLabel = document.createElement('label');
        toggleLabel.style.display = 'flex'; toggleLabel.style.alignItems = 'center'; toggleLabel.style.cursor = 'pointer'; toggleLabel.style.gap = '6px';
        const toggle = document.createElement('input'); 
        toggle.type = 'checkbox'; toggle.checked = multiSelectMode;
        Object.assign(toggle.style, { cursor: 'pointer', accentColor: '#4f46e5' });
        toggle.onchange = (e) => { multiSelectMode = e.target.checked; renderToolbarContent(); };
        toggleLabel.appendChild(toggle);
        const span = document.createElement('span'); span.textContent = 'Multi-Select'; span.style.fontSize='14px';
        toggleLabel.appendChild(span);
        toolbarDiv.appendChild(toggleLabel);
    }

    const contentSpan = document.createElement('div');
    contentSpan.id = 'toolbar-actions';
    Object.assign(contentSpan.style, { display: 'flex', gap: '8px', alignItems:'center' });
    
    toolbarDiv.appendChild(contentSpan);
    document.body.appendChild(toolbarDiv);
    
    renderToolbarContent();
}

function renderToolbarContent() {
    const container = toolbarDiv.querySelector('#toolbar-actions');
    container.innerHTML = '';
    
    if (multiSelectMode) {
        // Process Button (showing count)
        const processBtn = document.createElement('button');
        processBtn.textContent = `Process (${selectionQueue.length})`;
        Object.assign(processBtn.style, { padding: '6px 12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize:'13px' });
        processBtn.onclick = () => finishSelection();
        
        // Clear Button
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        Object.assign(clearBtn.style, { padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize:'13px' });
        clearBtn.onclick = () => { selectionQueue = []; updateOverlay(null, []); renderToolbarContent(); };
        
        container.appendChild(processBtn);
        container.appendChild(clearBtn);
    }
    
    // Cancel Btn
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    Object.assign(cancelBtn.style, { padding: '6px 12px', background: '#374151', color: '#9ca3af', border: '1px solid #4b5563', borderRadius: '4px', cursor: 'pointer', fontSize:'13px' });
    cancelBtn.onclick = exitSelectionMode;
    container.appendChild(cancelBtn);
}

function onMouseDown(e) {
  // Ignore clicks on toolbar (though canvas catches them usually? toolbar has higher z-index, so events go to toolbar first)
  if (toolbarDiv && toolbarDiv.contains(e.target)) return;
  
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  endX = startX; endY = startY;
  // Visual update handled by mousemove
}

function onMouseMove(e) {
  if (!isDragging) return;
  endX = e.clientX;
  endY = e.clientY;
  
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  
  updateOverlay({ x: left, y: top, width, height }, selectionQueue);
}

function onMouseUp(e) {
  if (!isDragging) return;
  isDragging = false;
  
  // ignore clicks on toolbar if bubbles up (unlikely with new canvas but safe to keep)
  if (toolbarDiv && toolbarDiv.contains(e.target)) return;

  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  
  // Minimal drag check
  if (width < 5 || height < 5) {
      updateOverlay(null, selectionQueue); // clear drag box
      return;
  }

  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const selection = { x: left, y: top, width, height };
  
  if (multiSelectMode) {
      selectionQueue.push(selection);
      updateOverlay(null, selectionQueue); // Redraw with new "past" selection
      renderToolbarContent();
  } else {
      selectionQueue = [selection];
      finishSelection();
  }
}

function onKeyDown(e) {
    if (e.key === 'Escape') exitSelectionMode();
    if (e.key === 'Enter' && multiSelectMode && selectionQueue.length > 0) finishSelection();
}

function exitSelectionMode() {
    isSelecting = false;
    isDragging = false;
    // Tell background to reset icon
    try {
        browser.runtime.sendMessage({ action: 'selectionExited' });
    } catch(e) { /* ignore disconnected port */ }

    // Remove specific listener from canvas? No handle to canvas easily here unless stored.
    // Actually we stored it in overlay.js but here we can just remove global doc listeners.
    // The canvas listener is removed when canvas is destroyed.
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('keydown', onKeyDown);
    if (toolbarDiv) toolbarDiv.remove();
    toolbarDiv = null;
    removeOverlay();
}

async function finishSelection() {
    if (selectionQueue.length === 0) return;
    
    // Capture state
    const selections = [...selectionQueue];
    exitSelectionMode(); 
    
    // Show spinner immediately
    const popup = showPopup('processing', '');

    try {
        // Wait for overlay removal repaint (vital)
        await new Promise(r => setTimeout(r, 100));

        // Note: If page has scrollbars, ensure we capture viewport correctly.
        const resp = await browser.runtime.sendMessage({ action: 'captureViewport' });
        if (!resp || !resp.dataUrl) throw new Error('No capture data received');

        const img = new Image();
        // img.crossOrigin = "anonymous"; // REMOVED: Data URLs from captureVisibleTab are safe; setting clean origin explicitly might trigger CORS checks that fail on data: scheme in some browsers (Firefox)
        img.src = resp.dataUrl;
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });

        // Process all selections
        let combinedText = '';
        let combinedOriginal = '';
        const dpr = window.devicePixelRatio || 1;

        // Process sequentially to maintain order
        let index = 0;
        for (const sel of selections) {
            index++;
            // Log progress? Update popup?
            
            const sx = Math.round(sel.x * dpr);
            const sy = Math.round(sel.y * dpr);
            const sWidth = Math.round(sel.width * dpr);
            const sHeight = Math.round(sel.height * dpr);

            // Bounds check
            if (sx + sWidth > img.width) continue;
            if (sy + sHeight > img.height) continue;

            const canvas = document.createElement('canvas');
            canvas.width = sWidth;
            canvas.height = sHeight;
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

            console.log(`Processing selection ${index}/${selections.length}`);
            // OCR
            const { text, originalText } = await performOCR(canvas);
            
            if (combinedText) combinedText += '\n\n';
            combinedText += text;
            
            if (combinedOriginal) combinedOriginal += '\n\n';
            combinedOriginal += originalText;
        }

        updatePopup(popup, combinedText, combinedOriginal);

    } catch (e) {
        console.error('OCR Batch failed:', e);
        showPopup('done', 'Error processing: ' + e.message);
    }
}

function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}