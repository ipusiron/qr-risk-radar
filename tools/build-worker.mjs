// vendor/qr-scanner/qr-scanner-worker.min.js（ES モジュール）を、通常のスクリプトとして読める js/qr-worker.js に包み直す
// 使い方: node tools/build-worker.mjs [--check]（--check は書き出さず、js/qr-worker.js が最新かだけを確かめる）
// 理由: qr-scanner はデコーダーを import() で読む。Chromium・Edge は file:// で開いたページの import() を拒むため、
//   ファイルを直接開くと画像やカメラから読めない。中身（Blob からワーカーを作る関数）は1文字も変えず、export だけを外す
import fs from "node:fs";
import { pathToFileURL } from "node:url";

const ROOT = new URL("../", import.meta.url);
const SRC = new URL("vendor/qr-scanner/qr-scanner-worker.min.js", ROOT);
const OUT = new URL("js/qr-worker.js", ROOT);
const HEAD = "export const createWorker=";
const TAIL = "//# sourceMappingURL=qr-scanner-worker.min.js.map\n";

export function render(src) {
  if (!src.startsWith(HEAD) || !src.endsWith(TAIL) || src.indexOf("export", 1) !== -1) throw new Error("qr-scanner-worker.min.js の形が想定と違う");
  const expr = src.slice(HEAD.length, src.length - TAIL.length);
  return [
    "// 生成物（tools/build-worker.mjs が vendor/qr-scanner/qr-scanner-worker.min.js から作る。手で編集しない）",
    "// qr-scanner@1.4.2 のデコーダー（MIT License, Copyright (c) 2017 Nimiq, danimoh。vendor/qr-scanner/LICENSE）。",
    "// ES モジュールの export を外し、通常のスクリプトから使える形にしただけで、中身は同じ",
    `globalThis.QRWorker = { createWorker: ${expr} };`,
    "",
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const text = render(fs.readFileSync(SRC, "utf8"));
  if (process.argv.includes("--check")) {
    const ok = fs.existsSync(OUT) && fs.readFileSync(OUT, "utf8") === text;
    console.log(ok ? "一致" : "js/qr-worker.js が古い");
    process.exitCode = ok ? 0 : 1;
  } else {
    fs.writeFileSync(OUT, text);
    console.log("wrote js/qr-worker.js", text.length);
  }
}
