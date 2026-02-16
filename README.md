# OCR Extension (Refactored)

A powerful, privacy-focused browser extension for extracting text from images, comics (manhwa), and protected websites using advanced OCR and preprocessing pipelines.

## Overview

This extension allows users to select any region of a webpage (including images, videos, and canvas elements) and extract text using Tesseract.js running entirely in the browser. It features specialized pipelines for cleaning text, reconstructing sentences, and even translating content on the fly.

## Key Features

- **In-Browser OCR**: Uses Tesseract.js (WASM) for local, private text recognition.
- **Advanced Preprocessing (Image)**:
  - Grayscale, Contrast, Blur, Thresholding
  - Optimized for comic bubbles (Manhwa Mode)
- **Advanced Postprocessing (Text)**:
  - Noise cleaning, Regex corrections
  - Dictionary-based spell checking
  - Text reconstruction (merging broken lines)
- **Translation Integration**:
  - Built-in Bing Translator support (shimmed for browser usage)
  - Auto-detect source language
- **Privacy First**: No images are sent to external OCR servers. Translation is the only external call (optional).

## Installation

### From Source
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load in Firefox:
   - Go to `about:debugging`
   - Click "This Firefox" -> "Load Temporary Add-on"
   - Select `manifest.json` from the project root.

## Usage

1. **Activate**: Click the extension icon or use the shortcut (`Ctrl+Shift+S`).
2. **Select**: Click and drag to draw a box around the text you want to capture.
3. **Review**: The popup appears with the extracted text.
4. **Edit/Copy**: Edit the text directly or use the buttons to copy, translate, or format.

## Configuration

Access the settings via the popup gear icon or the extension options page.

- **OCR Language**: Select Tesseract language (default: English).
- **Preprocessing**: Toggle image filters like contrast or thresholding to improve accuracy.
- **Text Cleaning**: Customize replacement rules or enabling continuous text reconstruction mode for broken lines.

## Project Structure

The project has been refactored for maintainability:

- `src/background/` - Extension background service worker.
- `src/content/` - Content scripts injected into pages (overlay, popup UI).
- `src/settings/` - Options page logic.
- `src/lib/` - Core logic libraries:
  - `ocr/` - Image/Text processing pipelines and config.
  - `translate/` - Translation API shims.
- `src/ui/` - Reusable UI components (buttons, debuggers).
- `src/utils/` - Shared utilities (storage, image helpers).

## Build Instructions (For Developers & Reviewers)

### Prerequisites
- Node.js 18+
- npm 9+

### Build Steps
1. `npm ci` (Install dependencies)
2. `npm run build` (Run Webpack)
3. Output is in `dist/`

### File Manifest
- `src/` — Source code
- `dist/` — Compiled extension (generated)
- `build.sh` — Reproducible build script

## License

MIT


