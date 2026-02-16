import { translate } from 'bing-translate-api';

// Background script - handles extension lifecycle
console.log('OCR Extension background script loaded');

// Create context menu item on install/startup
browser.contextMenus.create({
  id: "open-settings",
  title: "Open Settings",
  contexts: ["browser_action"],
}, () => { if (browser.runtime.lastError) {} });

// Domain Quick Add Context Menu
browser.contextMenus.create({
  id: "quick-add-domain",
  title: "Quick Add Domain (Loading...)", 
  contexts: ["all"], // Show everywhere except maybe editable?
}, () => { if (browser.runtime.lastError) {} });

// Update context menu title based on current domain status
async function updateContextMenu(tabId) {
    try {
        const tab = await browser.tabs.get(tabId);
        if (!tab.url || tab.url.startsWith('about:') || tab.url.startsWith('moz-extension:')) {
             browser.contextMenus.update("quick-add-domain", { visible: false });
             return;
        }

        const url = new URL(tab.url);
        const domain = url.hostname;
        
        // Get settings
        const { floating_button_mode, floating_button_blacklist, floating_button_whitelist } = 
            await browser.storage.local.get(['floating_button_mode', 'floating_button_blacklist', 'floating_button_whitelist']);
            
        const mode = floating_button_mode || 'blacklist';
        const blacklist = floating_button_blacklist || [];
        const whitelist = floating_button_whitelist || [];
        
        let label = '';
        let enabled = true;

        if (mode === 'blacklist') {
            if (blacklist.includes(domain)) {
                label = `Remove ${domain} from Blacklist`;
            } else {
                label = `Block Floating Button on ${domain}`;
            }
        } else {
            // Whitelist mode
             if (whitelist.includes(domain)) {
                label = `Remove ${domain} from Whitelist`;
            } else {
                label = `Show Floating Button on ${domain}`;
            }
        }
        
        browser.contextMenus.update("quick-add-domain", { title: label, visible: true });
        
    } catch (e) {
        // console.error(e);
        browser.contextMenus.update("quick-add-domain", { visible: false });
    }
}

browser.tabs.onActivated.addListener(activeInfo => updateContextMenu(activeInfo.tabId));
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') updateContextMenu(tabId);
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "open-settings") {
    browser.runtime.openOptionsPage();
  }
  
  if (info.menuItemId === "quick-add-domain") {
      const url = new URL(tab.url);
      const domain = url.hostname;
      
      const { floating_button_mode, floating_button_blacklist, floating_button_whitelist } = 
            await browser.storage.local.get(['floating_button_mode', 'floating_button_blacklist', 'floating_button_whitelist']);
      
      const mode = floating_button_mode || 'blacklist';
      
      if (mode === 'blacklist') {
          const list = floating_button_blacklist || [];
          if (list.includes(domain)) {
              // Remove
              const newList = list.filter(d => d !== domain);
              await browser.storage.local.set({ floating_button_blacklist: newList });
          } else {
              // Add
              list.push(domain);
              await browser.storage.local.set({ floating_button_blacklist: list });
          }
      } else {
          // Whitelist
          const list = floating_button_whitelist || [];
           if (list.includes(domain)) {
              // Remove
              const newList = list.filter(d => d !== domain);
              await browser.storage.local.set({ floating_button_whitelist: newList });
          } else {
              // Add
              list.push(domain);
              await browser.storage.local.set({ floating_button_whitelist: list });
          }
      }
      // Update menu immediately
      updateContextMenu(tab.id);
  }
});

// Helper to change icon state
function updateIcon(state) {
  const path = state === 'active' 
    ? {
        "16": "icons/active/icon16.png",
        "32": "icons/active/icon32.png",
        "48": "icons/active/icon48.png",
        "128": "icons/active/icon128.png"
      }
    : {
        "16": "icons/icon16.jpeg",
        "32": "icons/icon32.jpeg",
        "48": "icons/icon48.jpeg",
        "128": "icons/icon128.jpeg"
      };
  
  browser.browserAction.setIcon({ path });
}

// Handle commands (Keyboard Shortcuts)
browser.commands.onCommand.addListener(async (command) => {
  if (command === "activate-ocr") {
    // Need current active tab
    const tabs = await browser.tabs.query({active: true, currentWindow: true});
    if (tabs.length > 0) {
      updateIcon('active');
      browser.tabs.sendMessage(tabs[0].id, { action: 'startSelection' });
    }
  }
  if (command === "open-settings") {
    browser.runtime.openOptionsPage();
  }
});

browser.browserAction.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked for tab', tab.id);
  updateIcon('active');
  browser.tabs.sendMessage(tab.id, { action: 'startSelection' });
});

// Translation Cache
const translationCache = {}; // Simple in-memory cache

browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message && message.action === 'selectionExited') {
    updateIcon('default');
  }

  if (message && message.action === 'captureViewport') {
    try {
      // captureVisibleTab of the sender's window
      const dataUrl = await browser.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' });
      return { dataUrl };
    } catch (err) {
      console.error('captureVisibleTab failed:', err);
      throw err;
    }
  }

  // --- Handling Translation ---
  if (message && message.action === 'translate') {
      const { text, from, to } = message;
      console.log('[Background] Translation request received:', { from: from || 'auto', to: to || 'en', textLength: text?.length });
      
      if (!text) {
          console.log('[Background] Empty text, returning null');
          return { error: 'Empty text' };
      }

      // Normalize cache key
      const cacheKey = `${from || 'auto'}_${to || 'en'}_${text.trim()}`;
      if (translationCache[cacheKey]) {
          console.log('[Background] Translation cache hit');
          return translationCache[cacheKey];
      }

      try {
          console.log('[Background] Calling translate API...');
          const res = await translate(text, from || null, to || 'en');
          console.log('[Background] Translation API response:', res);
          
          // Map result to a consistent structure
          const result = {
              translatedText: res.translation,
              detectedSource: res.language ? res.language.from : null
          };
          
          translationCache[cacheKey] = result;
          
          // Limit cache size to prevent memory leaks (keep last 100)
          const keys = Object.keys(translationCache);
          if (keys.length > 100) delete translationCache[keys[0]];

          console.log('[Background] Returning translation result');
          return result;
      } catch (e) {
          console.error('[Background] Translation failed:', e);
          console.error('[Background] Error details:', e.message);
          if (e.stack) console.error('[Background] Stack:', e.stack);
          
          // Return structured error instead of throwing
          return { 
              error: e.message || 'Translation failed',
              details: e.toString()
          };
      }
  }
});

