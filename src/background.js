// Background script - handles extension lifecycle
console.log('OCR Extension background script loaded');

browser.browserAction.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked for tab', tab.id);
  browser.tabs.sendMessage(tab.id, { action: 'startSelection' });
});

browser.runtime.onMessage.addListener(async (message, sender) => {
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
