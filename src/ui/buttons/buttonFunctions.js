/**
 * Button Functions
 * Contains all button click handlers and text processing functions
 */

export function applyManhwaCorrections(text) {
  return text
    .replace(/1/g, 'I')
    .replace(/5/g, 'S')
    .replace(/0/g, 'O')
    .replace(/2/g, 'Z')
    .replace(/3/g, 'E')
    .replace(/4/g, 'A')
    .replace(/6/g, 'G')
    .replace(/7/g, 'T')
    .replace(/8/g, 'B')
    .replace(/9/g, 'g');
}

export function createButtonHandlers(textarea, copyToClipboard) {
  return {
    lowerCase: () => {
      const correctedText = applyManhwaCorrections(textarea.value);
      textarea.value = correctedText.toLowerCase();
    },
    upperCase: () => {
      textarea.value = textarea.value.toUpperCase();
    },
    singleLine: () => {
      const correctedText = applyManhwaCorrections(textarea.value);
      textarea.value = correctedText.replace(/\n/g, ' ');
    },
    manhwaMode: async () => {
      const correctedText = applyManhwaCorrections(textarea.value);
      textarea.value = correctedText;
      await copyToClipboard(correctedText);
      return true;
    },
    copy: async () => {
      await copyToClipboard(textarea.value);
      return true;
    },
    close: (popup) => {
      document.body.removeChild(popup);
    }
  };
}

export function createFeedbackHandler(button, originalText) {
  return async () => {
    const success = await button.handler();
    if (success) {
      button.textContent = 'Copied!';
      setTimeout(() => button.textContent = originalText, 2000);
    }
  };
}