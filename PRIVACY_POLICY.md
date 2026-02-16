# Privacy Policy for OCR Extension

**Effective Date:** 2026-02-16

## 1. Data Collection and Usage

This extension respects your privacy. It is designed to perform Optical Character Recognition (OCR) locally within your browser using Tesseract.js.

### Local Processing
- **OCR Data**: All image processing and text extraction happens locally on your device. No images or extracted text are uploaded to our servers.
- **Settings**: Your preferences (e.g., target language, dark mode) are stored locally in your browser using the `browser.storage` API.

### External Services
- **Translation (Optional)**: If you choose to use the translation feature, the extracted text will be sent to the Microsoft Bing Translator API proxy. This is the only instance where data leaves your browser, and it only occurs upon your explicit action (clicking the "Translate" button).
  - We do not store, log, or share the text you translate.
  - Please refer to the [Microsoft Privacy Statement](https://privacy.microsoft.com/en-us/privacystatement) for details on how they handle translation data.

## 2. Permissions

We request the minimum permissions necessary for the extension to function:
- **Access your data for all websites (`<all_urls>`)**: Required to inject the overlay and capture screenshots of the page you are viewing for OCR processing.
- **Access browser tabs**: Required to capture the visible tab area.
- **Write to the clipboard**: Required to allow you to copy the extracted text.
- **Input data to the clipboard**: Required to allow you to copy the extracted text.
- **Storage**: Required to save your configuration and settings.

## 3. Third-Party Libraries

This extension uses the following open-source libraries:
- **Tesseract.js**: For OCR functionality (runs in-browser).
- **Bing-Translate-API**: For translation functionality.

## 4. Updates to this Policy

We may update this privacy policy from time to time. The updated version will be indicated by an updated "Effective Date" and the updated version will be effective as soon as it is accessible.

## 5. Contact Us

If you have any questions about this Privacy Policy, please contact us via the support section on the extension's download page.
