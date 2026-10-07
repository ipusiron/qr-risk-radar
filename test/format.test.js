import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const lines = (f) => read(f).split("\n");
const longest = (f) => Math.max(...lines(f).map((l) => [...l].length));

// 手で書くファイル（生成物の js/psl-data.js・js/qr-worker.js・js/model.js と vendor/ は除く）
const HAND = ["app.js", "style.css", "js/url-core.js", "js/messages.js", "js/samples.js",
  "tools/build-psl.mjs", "tools/build-worker.mjs", "tools/calibrate.mjs", "tools/make-qr.mjs",
  ...fs.readdirSync(new URL("../test/", import.meta.url)).filter((f) => f.endsWith(".js")).map((f) => "test/" + f)];

test("1行に詰め込んでいない: JS・CSS・テストは160文字以下、index.html は250文字以下", () => {
  for (const f of HAND) assert.ok(longest(f) <= 160, `${f} ${longest(f)}`);
  assert.ok(longest("index.html") <= 250, String(longest("index.html")));
  const minLines = { "app.js": 300, "style.css": 200, "js/url-core.js": 300, "index.html": 80 };
  for (const [f, n] of Object.entries(minLines)) assert.ok(lines(f).length >= n, `${f} ${lines(f).length}`);
});

test("app.js に日本語の文字列を置かない（文言は js/messages.js から引く）", () => {
  const code = read("app.js").replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !/^\s*\/\//.test(l)).map((l) => l.replace(/\/\/.*$/, "")).join("\n");
  const kana = new RegExp("[" + String.fromCodePoint(0x3040) + "-" + String.fromCodePoint(0x30ff) + String.fromCodePoint(0x4e00) + "-"
    + String.fromCodePoint(0x9fff) + String.fromCodePoint(0xff01) + "-" + String.fromCodePoint(0xff60) + "]");
  assert.ok(!kana.test(code), (code.match(new RegExp(".*" + kana.source + ".*")) || [""])[0]);
});
