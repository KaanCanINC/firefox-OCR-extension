# OCR Extension — Source & Build Instructions

This repository contains the full source code for the OCR Extension and the exact steps a reviewer can use to reproduce the published build.

## What is included

- `src/` — original, unminified source files (JavaScript modules, UI files)
- `package.json`, `pnpm-lock.yaml` (if present), `webpack.config.js` — build configuration
- `dist/` — build outputs (generated, included for convenience)
- `build.sh` — reproducible build script
- `prepare-source.sh` — helper that packages the source for reviewer

Third-party libraries (e.g. `tesseract.js`) are managed via `package.json` and are not considered proprietary source of the extension.

---

## Environment requirements

- Operating system: Linux, macOS, or Windows (tested on Ubuntu 22.04)
- Node.js: 18.x (LTS) or newer
- npm: 9.x or newer (or `pnpm` if you prefer)
- `zip` or `tar` utility available for packaging (used by `prepare-source.sh`)

Recommended: install Node via nvm:

```bash
nvm install 18
nvm use 18
```

## Build instructions (step-by-step)

1. Install dependencies

```bash
# from repository root
npm ci
# or: pnpm install
```

2. Run the production build

```bash
npm run build
```

3. Result

- The `dist/` directory will contain the generated extension bundles that are packaged for distribution.

## Build script

Use `build.sh` to run the full reproducible build (installs and builds):

```bash
./build.sh
```

`build.sh` runs `npm ci` and `npm run build` and exits on error.

## Preparing the source package for reviewers

Run `prepare-source.sh` to create `source-for-review.zip` (or a tarball) containing the non-generated source files a reviewer needs:

```bash
./prepare-source.sh
```

The produced archive includes:

- `src/` (unminified source)
- `package.json`, `pnpm-lock.yaml` (if present), `webpack.config.js`
- `build.sh`, `prepare-source.sh`, `README.md`

It does not include `node_modules/` by default. The reviewer can run `npm ci` and then `./build.sh` to reproduce the `dist/` outputs.

## Tooling and versions used by this project

- `webpack` (used via `npm run build`) — see `devDependencies` in `package.json`
- `tesseract.js` (OCR library) — installed from npm; worker/core files are bundled into `dist/libraries/tesseract/` and referenced from extension-local URLs.

If you need exact versions used by the last successful build, see `package.json` and `pnpm-lock.yaml` / `package-lock.json`.

## Reviewer notes (copy into AMO notes)

We used a bundler (`webpack`) and minification for `dist/` artifacts. The original unminified sources are provided in `src/`.

To reproduce locally:

1. `npm ci`
2. `npm run build`

If you require a packaged source upload, run `./prepare-source.sh` and attach `source-for-review.zip`.

If you need the add-on to run on a specific test site that requires credentials, provide me the target and I will add reviewer credentials here.

---

If anything in these instructions should be adjusted for your environment or the AMO reviewer process, tell me and I will update the files accordingly.# Firefox OCR Extension

[![Build Status](https://img.shields.io/badge/build-passed-brightgreen)](https://github.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A lightweight Firefox extension that lets you select screen regions, performs OCR with Tesseract, and provides a compact popup UI for processing and manipulating extracted text. The extension includes a slide-in settings panel, site-scoped find-and-replace rules ("Manhwa Mode"), delete-character rules, import/export, and autosave options.

## Features

- Select any screen region and run OCR (Tesseract.js).
- Compact popup with editing tools: Lowercase, Uppercase, Single Line, Copy, Manhwa Mode.
- Manhwa Mode: configurable delete-character list + find & replace rules applied in order (deletes first, then replacements).
- Per-scope rules: `Global` and `site:<origin>` scopes for site-specific rules.
- Slide-in settings panel (left side) triggered by a floating FAB injected into pages.
- Import/export settings (including an "Export All" aggregate export of all site scopes).
- Auto-save toggle to persist changes automatically.
- Safe content-script behavior: avoids calling extension-only APIs directly in page context.

## Quick Demo

1. Click the floating Settings FAB on a page (bottom-left) to open settings.
2. Use the selection tool to choose a region and run OCR.
3. In the popup, apply transformations or Manhwa Mode.

## Installation

Development (local)

1. Clone the repo:

```bash
git clone <your-repo-url>
cd OCR
```

2. Install dependencies and build:

```bash
# with npm
npm install
npm run build

# or in dev watch mode
npm run dev
```

3. Load extension in Firefox (temporary / developer):

- Open `about:debugging#/runtime/this-firefox`.
- Click "Load Temporary Add-on" and select `manifest.json` from the project root.

Notes

- Building populates `dist/` artifacts used in the extension bundle.
- For quick debugging you can use the dev server (`npm run dev`) and load files from `src/` while iterating, but a rebuild is required for `dist/` updates.

## Technical details

Technology stack

- Vanilla JavaScript (ES modules)
- Webpack for bundling
- Tesseract.js for OCR
- Browser WebExtension APIs (Firefox; code is cautious about chrome-specific APIs)

Project layout (selected files)

- `manifest.json` — extension manifest
- `package.json` — scripts and dependencies
- `webpack.config.js` — bundle configuration
- `src/` — source files
  - `content.js` — content script: adds FAB, selection overlay, and intercepts Settings clicks safely
  - `popup.js` — popup UI and actions
  - `settings.js` — settings panel builder and persistence UI
  - `ocr.js` — OCR wrapper using Tesseract.js
  - `overlay.js` — selection overlay helpers
  - `buttons/` — button factories & per-action logic (e.g. `manhwaMode.js`)
- `dist/` — built bundles (generated by webpack)

Storage & data model

- Per-scope storage keys in `localStorage`:
  - `manhwa_rules::${encodeURIComponent(scope)}` — JSON array of rules [{find, replace}, ...]
  - `manhwa_deletes::${encodeURIComponent(scope)}` — JSON array of delete strings
- Global legacy keys (kept for compatibility):
  - `replacementsText` and `charsToDelete` — legacy formats
- `copyConfig` — JSON object for copy-to-clipboard per-action checkboxes
- `manhwa_autoSave` — boolean in localStorage for auto-save

Manhwa Mode processing

1. Delete characters are applied first (each delete string removed from text).
2. Replacement rules are applied after deletes.
3. Replacements use escaped-regex matching with lookaround to avoid mid-word matches and are case-insensitive. The replacement string is used literally.
4. Fallback to simple string replace if regex building fails.

Safety and extension context

- Content script avoids calling extension-only APIs (e.g., `chrome.tabs`) directly from page capture handlers. When necessary the script dispatches `CustomEvent`s or uses `browser.runtime.sendMessage` to request background actions.

## Configuration options

Accessible in the slide-in Settings panel (`openSettingsPanel()` in `src/settings.js`):

- Rule Scope: `Global` or `site:<origin>` — create site-specific scopes, add/remove scopes.
- Find & Replace Rules: two-column input to add `find` → `replace` pairs.
- Characters to Delete: list of strings/characters removed before replacements.
- Auto-save: toggle to persist changes immediately. When enabled, a brief toast appears confirming the setting.
- Import Settings: JSON import of settings (supports current and legacy formats).
- Export Settings: exports aggregated site-scoped rules and `copyConfig` into `ocr-settings-all.json` (previously offered as "Export All").

Storage keys and formats

- Rules are stored as arrays of objects: `[ { find: "...", replace: "..." }, ... ]`
- Deletes are stored as arrays of strings: `[ "…", "…" ]`
- `copyConfig` is `{ "copy_lowercase": true, ... }`


## Development notes

- To run a development build and watch for changes:

```bash
npm run dev
```

- Production bundle:

```bash
npm run build
```

- Webpack outputs `dist/content.js` which is used by the extension.

## Future roadmap

Planned improvements and ideas:

- Unified UI polish: refine spacing, better mobile handling inside popup, and theme variables.
- Rule testing UI: preview a rule against an example text before saving.
- Sync storage: add optional sync via browser.storage.sync for cross-device profiles.
- Rule import/export presets: pre-built rule sets for common sites (manga/manhwa fonts, common OCR noise cleanup).
- Unit/integration tests for the rule engine and parsing logic.
- Convert to TypeScript for stronger type safety and easier refactors.

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repo and create a feature branch.
2. Run `npm install` and modify code in `src/`.
3. Build with `npm run build` and test in `about:debugging`.
4. Open a PR describing the change.

Please follow existing code style and run the build to ensure there are no syntax errors.

## License

MIT — see the `LICENSE` file.


