# vendor/

外部から読み込んでいたライブラリーを、npm の配布物からそのまま取り出して置いています。CDN に頼らないので、Content-Security-Policy を `'self'` だけにできます。中身は1バイトも変えていません（`test/vendor.test.js` が SHA-256 を照合します）。

| ファイル | 出所 | ライセンス |
|---|---|---|
| `qr-scanner/qr-scanner.umd.min.js`・`qr-scanner-worker.min.js`（と `.map`） | npm `qr-scanner@1.4.2`（nimiq/qr-scanner） | MIT（`qr-scanner/LICENSE`） |
| `qrcode-generator/qrcode.js` | npm `qrcode-generator@2.0.4` の `dist/qrcode.js`（kazuhikoarase/qrcode-generator） | MIT（`qrcode-generator/LICENSE`。npm の配布物に含まれないため GitHub のリポジトリーから取得） |

- 取得: 2026-10-07。npm のレジストリーが示す `integrity`（sha512）と、取得した tarball のハッシュが一致することを確かめた
- `qr-scanner.umd.min.js` は、同じフォルダーの `qr-scanner-worker.min.js` を `import()` で読み込みます。ワーカーは `Blob` から作られるため、CSP に `worker-src blob:` が要ります
- 更新するときは、npm の tarball から同じ場所へ上書きし、`test/vendor.test.js` のハッシュを書き換えます
