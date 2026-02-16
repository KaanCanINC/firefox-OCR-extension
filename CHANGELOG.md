# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-02-16

### Added
- **Translation Feature**: Integrated `bing-translate-api` with a custom browser shim (`got-shim.js`) to allow direct translation of OCR results.
- **Language Re-OCR**: Changing the target language in the popup now automatically triggers a re-analysis of the captured image region with the new language model.
- **Project Restructuring**: Complete overhaul of the file system for better maintainability (separated concerns into `lib`, `ui`, `content`, `background` folders).

### Changed
- **File Structure**:
  - Moved core logic to `src/lib/`.
  - Consolidated UI components in `src/ui/`.
  - Grouped entry points into specific directories (`src/background`, `src/content`, `src/settings`).
- **Dependencies**:
  - Audited `package.json`. No unused dependencies found, but project structure optimized around them.
- **Webpack Config**: Updated entry points to reflect new directory structure.

### Fixed
- **OCR Language Bug**: Fixed an issue where changing the language in the dropdown didn't update the underlying Tesseract engine, resulting in garbage output for non-English text.
- **Canvas Tainting**: Implemented blob-based image handling to avoid security errors when capturing cross-origin content.
