# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QR Risk Radar is a client-side tool that breaks URLs and QR code contents into parts and counts common phishing signals. Part of the "100 Security Tools with Generative AI" project (Day 074).

It is a defensive/educational tool. Nothing is sent anywhere: no network requests, no links to the analyzed URL, and the only stored data is the user's trusted-domain list in localStorage.

## Architecture

- Static HTML/CSS/JS, no build step, no npm dependencies. Works from GitHub Pages, a local server, or `file://` (including QR decoding in Chromium/Edge/Firefox).
- Plain scripts (not ES modules) attached to `globalThis`, loaded in this order by `index.html`:
  1. `js/psl-data.js` – generated Public Suffix List (`QRPsl`)
  2. `js/model.js` – generated points/thresholds/evaluation (`QRModel`)
  3. `js/url-core.js` – pure logic (`QRRiskCore`): `publicSuffix`, `registrableDomain`, `analyze`, `score`, brand list
  4. `js/messages.js` – all UI strings and signal explanations in Japanese (`QRText`). `app.js` must not contain Japanese literals
  5. `js/samples.js` – learning samples (`QRSamples`), also the source of `samples/qr/*.png`
  6. `vendor/qr-scanner/qr-scanner.umd.min.js`, `js/qr-worker.js` (generated, decoder without the ES `export`), `vendor/qrcode-generator/qrcode.js`
  7. `app.js` – DOM only (tabs, result rendering, trusted domains, camera/file decoding, QR generation)
- CSP is `'self'` only plus `worker-src blob:` (qr-scanner builds its worker from a Blob). The default qr-scanner overlay uses inline `style` attributes, so `app.js` passes its own `overlay` element.
- `app.js` overrides `QrScanner.createQrEngine` to build the worker from `js/qr-worker.js` instead of `import()` (Chromium/Edge block `import()` on `file://`).

## Scoring

- `analyze(input)` returns `{ kind: "url"|"scheme"|"text", input, url, signals: [{ id, detail }] }`. `score(result, model)` adds points once per signal id; `danger-scheme` forces `high`.
- Points, TLD points and thresholds (medium 3, high 4) come from `tools/calibrate.mjs`, which reads data in `tools/corpus/` (gitignored: CrUX JP, OpenPhish feed, JPCERT/CC phishurl-list). Never hand-edit `js/model.js`; rerun `node tools/calibrate.mjs --write`.
- `SCORING.md` and `README.md` tables are verified against `js/model.js` and the core by `test/readme.test.js`. If the model changes, regenerate the tables, not the test.
- Adding a signal: add it in `url-core.js`, add its text in `messages.js`, add it to `IDS` in `tools/calibrate.mjs`, recalibrate, update the SCORING.md table.

## Commands

```bash
npm test                              # node --test "test/*.test.js" (Node 22+)
node tools/build-psl.mjs [--check]    # tools/public_suffix_list.dat -> js/psl-data.js
node tools/build-worker.mjs [--check] # vendor qr-scanner worker -> js/qr-worker.js
node tools/make-qr.mjs [--check]      # js/samples.js -> samples/qr/*.png
node tools/calibrate.mjs [--write]    # needs tools/corpus/ (see SCORING.md)
python -m http.server 8000            # serve locally
```

## Rules

- Keep `vendor/` byte-identical to the npm tarballs (`test/vendor.test.js` checks SHA-256).
- Render user input with `textContent`; no `innerHTML`, `eval`, inline handlers or style attributes (`test/html.test.js`).
- Japanese docs: no space between Japanese and Latin characters, long-vowel forms (ブラウザー, サーバー), at most two bold spans per section (`test/readme.test.js`).
- Sample domains use `.example`/`example.com` except where a real TLD or service is the point of the sample.
