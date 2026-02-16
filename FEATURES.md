# Features

## Core Functionality
- **Screen Capture**: Draw a selection box over any part of the web page.
- **OCR Engine**: Tesseract.js (v5) running in WebAssembly for high-performance usage.
- **Offline Capable**: Core OCR works without internet (after checking language data).

## Image Pipeline
Processing stages applied before OCR to improve accuracy:
1. **Resize**: Upscaling for small text.
2. **Grayscale**: Converting to B&W intensity.
3. **Contrast**: Enhancing text visibility.
4. **Median Blur**: Reducing noise (salt-and-pepper).
5. **Adaptive Thresholding**: Binarizing text for sharp edges.
6. **Morphology**: Cleaning up text shapes.
7. **Region Extraction**: Focusing on the main content area (e.g., speech bubbles).

## Text Pipeline
Post-processing to fix common OCR errors:
1. **Noise Cleaning**: Removing random characters/artifacts.
2. **Normalization**: Standardizing whitespace.
3. **Manhwa Mode**: Special handling for vertical text or comic layouts.
4. **Dictionary Correction**: Fuzzy matching against common words.
5. **User Rules**: Custom find-and-replace patterns defined in settings.
6. **Reconstruction**: Merging broken lines back into paragraphs.

## Translation
- **Bing Translate**: Uses the Bing Free API shimmed for extension usage.
- **Auto-Detect**: Source language is automatically detected.
- **Integrated UI**: Translation replaces the original text in the popup for immediate use.

## User Interface
- **Popup Editor**: Floating editor to review and copy text.
- **Overlay**: Non-intrusive canvas overlay for selection.
- **Settings Panel**: Comprehensive configuration for all pipelines.
- **Debug Mode**: Visualizer for the image processing steps.
