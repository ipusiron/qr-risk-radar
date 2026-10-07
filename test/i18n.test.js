import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { core } from "./load.js";

const C = core();
const read = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
for (const f of ["js/payload-core.js", "js/messages.js", "js/messages-en.js", "js/i18n.js", "js/samples.js"]) vm.runInThisContext(read(f));
const { ja, en } = globalThis.QRTexts;
const I18N = globalThis.QRI18n;
const html = read("index.html");
const app = read("app.js");
const JAPANESE = new RegExp("[" + [[0x3040, 0x30ff], [0x3400, 0x9fff], [0xff00, 0xffef]]
  .map(([a, b]) => String.fromCodePoint(a) + "-" + String.fromCodePoint(b)).join("") + "]");

// 辞書の形（キーの入れ子と、値が文字列・関数・配列のどれか）
function shape(o) {
  if (typeof o === "function") return "function";
  if (Array.isArray(o)) return `array(${o.length})`;
  if (o && typeof o === "object") return Object.fromEntries(Object.keys(o).sort().map((k) => [k, shape(o[k])]));
  return typeof o;
}

test("日本語と英語の辞書は同じ形（キーの入れ子と値の種類）", () => {
  assert.deepEqual(shape(en), shape(ja));
  assert.ok(Object.keys(ja.html).length >= 25 && Object.keys(ja.signals).length >= 30);
});

test("英語の文言に日本語の文字がない（兆候の説明は、実際の兆候の detail で呼び出す）", () => {
  const strings = [];
  const walk = (o, path) => {
    if (typeof o === "string") strings.push([path, o]);
    else if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`);
  };
  walk(en, "en");
  for (const [k, f] of Object.entries(en.ui)) if (typeof f === "function") strings.push([`ui.${k}`, f("example.co.jp", 3, 4)]);
  strings.push(["levelNote.low", en.levelNote.low("59.6")], ["payload.mask", en.payload.mask(12)]);
  for (const v of ["WPA", "WEP", "nopass", "SAE"]) strings.push([`payload.value.${v}`, en.payload.value("security", v)]);
  strings.push(["payload.value.hidden", en.payload.value("hidden", "true")]);
  // サンプルと、ブランドの兆候が出る URL を全部判定して、英語の説明にする
  const urls = [...globalThis.QRSamples.flatMap((g) => g.items.map((s) => s.url)), "https://eki-net.example/", "https://sagawa.example/x",
    "https://www.eki-net.com/", "https://login.jreast.example/", "https://example.com/mufg/", "https://amaz0n.example/", "https://rakuten.cn/",
    "https://xn--pckua2a7gp15o89zb.com/", "http://0x7f000001:8080/a%252e", "https://a.b.c.d.example.com/" + "x".repeat(160)];
  let n = 0;
  for (const u of urls) {
    for (const s of C.score(C.analyze(u)).signals) {
      // 中身そのもの（日本語ドメインの表示名など）は除いて、文言の側だけを見る
      let text = en.signals[s.id](s.detail, s.points);
      // ただし brand（日本語の名前）は除かない。英語の説明が brandEn でなく brand を使っていたら見つける
      for (const [k, v] of Object.entries(s.detail)) {
        for (const x of [v].flat()) if (k !== "brand" && typeof x === "string" && x) text = text.split(x).join("");
      }
      strings.push([`signals.${s.id} ${u}`, text]);
      n++;
    }
  }
  assert.ok(n >= 60, String(n));
  for (const [path, v] of strings) assert.doesNotMatch(v, JAPANESE, `${path}: ${v}`);
});

test("サンプルとブランドに英語の名前がある", () => {
  for (const g of globalThis.QRSamples) {
    assert.doesNotMatch(g.groupEn, JAPANESE, g.group);
    for (const s of g.items) for (const k of ["titleEn", "noteEn"]) assert.ok(s[k] && !JAPANESE.test(s[k]), `${s.id} ${k}`);
  }
  for (const b of C.BRANDS) if (JAPANESE.test(b.name)) assert.ok(b.en && !JAPANESE.test(b.en), b.name);
});

test("index.html の data-i18n の文字・data-i18n-attr の属性は日本語の辞書と同じ。日本語を含む要素はすべて訳せる", () => {
  const texts = [...html.matchAll(/data-i18n="(\w+)"[^>]*>([^<]*)</g)];
  assert.ok(texts.length >= 25, String(texts.length));
  for (const [, key, text] of texts) assert.equal(text, ja.html[key], key);
  const attrs = [...html.matchAll(/<[^>]*data-i18n-attr="([^"]+)"[^>]*>/g)];
  assert.ok(attrs.length >= 3, String(attrs.length));
  for (const [tag, spec] of attrs) {
    for (const part of spec.split(";")) {
      const [attr, key] = part.split(":");
      const m = tag.match(new RegExp(`\\s${attr}="([^"]*)"`));
      assert.ok(m, `${key} ${attr}`);
      assert.equal(m[1], ja.html[key], key);
    }
  }
  const body = html.split("<body>")[1].replace(/<noscript>[\s\S]*?<\/noscript>/, "").replace(/<!--[\s\S]*?-->/g, "");
  const bare = [...body.matchAll(/<([a-z0-9]+)(?![^>]*data-i18n)[^>]*>([^<]*)</g)].filter(([, , text]) => JAPANESE.test(text));
  assert.deepEqual(bare.map((m) => m[0]), []);
  for (const tag of [...body.matchAll(/<[a-z][^>]*>/g)].map((m) => m[0])) {
    for (const [, attr, v] of tag.matchAll(/\s(placeholder|aria-label|alt|title)="([^"]*)"/g)) {
      if (JAPANESE.test(v)) assert.match(tag, new RegExp(`data-i18n-attr="[^"]*${attr}:`), tag);
    }
  }
});

test("app.js が引く文言のキーは、日英どちらの辞書にもある", () => {
  const ui = [...new Set([...app.matchAll(/\bU\.(\w+)/g), ...app.matchAll(/(?:qrStatus|setStatus\("\w+",) ?\(?"(\w+)"/g)].map((m) => m[1]))];
  assert.ok(ui.length >= 25, String(ui.length));
  for (const k of ui) {
    assert.ok(k in ja.ui, "ja " + k);
    assert.ok(k in en.ui, "en " + k);
  }
  const top = [...new Set([...app.matchAll(/\bT\.(\w+)/g)].map((m) => m[1]))];
  for (const k of top) assert.ok(k in ja && k in en, k);
});

test("初期の言語: ?lang= → 保存した選択 → ブラウザーの言語（日本語以外は英語）", () => {
  assert.equal(I18N.initialLanguage("?lang=en", "ja", ["ja-JP"]), "en");
  assert.equal(I18N.initialLanguage("?x=1&lang=ja", "en", ["en-US"]), "ja");
  assert.equal(I18N.initialLanguage("?lang=fr", "en", ["ja-JP"]), "en");
  assert.equal(I18N.initialLanguage("", null, ["ja-JP", "en"]), "ja");
  assert.equal(I18N.initialLanguage("", null, ["fr-FR"]), "en");
  assert.equal(I18N.initialLanguage("", null, []), "en");
  assert.equal(I18N.use("en").html.langButton, "JA");
  assert.equal(I18N.use("xx").html.langButton, "EN");
});
