# Project Brief: OCR Extension V2

## Overview
This project involves a significant upgrade to an existing OCR browser extension (Firefox target, Manifest V2). The goal is to enhance user experience, accessibility, and OCR accuracy through modular pipelines and improved UI/UX.

## Core Objectives
1.  **Enhance Accessibility:** Redesign settings access to avoid UI interference.
2.  **Improve UX:** Remove invasive browser confirmation dialogs, implement interaction blocking during selection, and fix key propagation issues.
3.  **Advanced OCR Processing:** Implement modular pipelines for:
    *   **Image Preprocessing:** Resize (2x), Contrast enhancement.
    *   **Text Cleaning:** Noise removal, Regex, Dictionary, User rules.
4.  **Data Management:** robust Global vs. Site-specific rule inheritance and persistence.
5.  **Feature Expansion:** Multi-selection mode, Diff preview, Toggleable popup buttons.

## Key Features
*   **Modular Pipelines:** Independent stages for image and text processing.
*   **Settings Page:** Dedicated HTML page for configuration.
*   **Interactive Diff:** Compare and restore original OCR text.
*   **Smart Rules:** Context-aware Find & Replace and value-specific deletion.
*   **Manhwa Mode:** Optimized for vertical text and speech bubbles.

## Technical Stack
*   **Platform:** Web Extension (Manifest V2, Firefox optimized).
*   **Core Lib:** Tesseract.js (WASM).
*   **Build:** Webpack (implied by `webpack.config.js`).
*   **Storage:** `browser.storage.local` / `chrome.storage.local`.