# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QR Risk Radar is a client-side security tool that analyzes QR codes and URLs for phishing patterns. Part of the "100 Security Tools with Generative AI" project (Day 074).

**Important**: This is a defensive security tool. All processing occurs client-side with no server communication.

## Architecture

- **Pure client-side application**: No backend, no build process
- **Static HTML/CSS/JS**: Can be served from any static hosting (GitHub Pages, file://)
- **External dependencies** (CDN loaded):
  - QR scanner library: `qr-scanner@1.4.2` from unpkg
  - QR code generation: Inlined QRCode.js library in app.js (lines 1-12)

### Fallback Mechanism
The scanner uses a dual-engine approach:
1. Primary: `qr-scanner` Web Worker for decoding
2. Fallback: Browser's native `BarcodeDetector` API (when Worker fails due to CSP/browser restrictions)

## Key Files

- **index.html**: Main UI with camera/file input for QR scanning (Japanese UI)
- **app.js**: Core risk detection logic with heuristic rules
- **style.css**: Styling with responsive design
- **test/**: Testing resources including QR generators and test cases

## Risk Detection System

### Rules Engine (app.js:165-370+)

The `RULES` array contains heuristic detection rules. Each rule has:
- `id`: Unique identifier
- `re` or `custom`: RegExp pattern or custom function
- `score`: Risk points (number or function)
- `msg`: Japanese description
- `category`: Classification (security, obfuscation, phishing, malware, etc.)

### Scoring Thresholds
- **Low**: 0-2 points
- **Medium**: 3-5 points
- **High**: 6+ points

### Key Detection Categories
- Dangerous schemes (javascript:, data:, file:) +3
- HTTP scheme (unencrypted) +2
- IP address hosts +2
- URL shorteners +2
- Open redirect parameters +2
- Punycode domains +2
- Unicode spoofing (homograph attacks) +3
- Executable file downloads +3
- Excessive tracking parameters +1

## Development Commands

```bash
# Serve locally with any static server
python3 -m http.server 8000
# or
npx http-server

# Deploy to GitHub Pages
git add .
git commit -m "Update QR Risk Radar"
git push origin main
```

## Testing

- **QR library test**: Open `test/test-qr-generator.html` in browser
- **Main app test**: Open `index.html` and test with sample URLs or QR images
- **Test cases**: See `test/TEST_CASES.md` for 200+ comprehensive test cases
- **QR samples**: Pre-generated test QR codes in `test/qr/` directory

## Key Features

- **Tabbed UI**: Separates manual input and QR scanner modes
- **Whitelist**: Trusted domain registration (localStorage persisted)
- **Base64 decoding**: Automatic detection and decoding of encoded payloads
- **Advanced obfuscation detection**: Hex encoding, double URL encoding, Unicode escapes
- **Japanese UI**: All messages and errors in Japanese

## Security Considerations

When modifying this codebase:
- All input must be sanitized using `escapeHtml()` function (app.js:101-105)
- DOM manipulation uses safe methods (textContent, createElement) instead of innerHTML
- Domain validation uses `isValidDomain()` before storage
- No external API calls - everything runs client-side
