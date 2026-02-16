// Background script - handles extension lifecycle
console.log('OCR Extension background script loaded');

// Create context menu item on install/startup
browser.contextMenus.create({
  id: "open-settings",
  title: "Open Settings",
  contexts: ["browser_action"],
}, () => {
  // Ignore error if item already exists
  if (browser.runtime.lastError) console.log(browser.runtime.lastError.message);
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open-settings") {
    browser.runtime.openOptionsPage();
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
});
