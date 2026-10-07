import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { core } from "./load.js";
import { pixels, readPixels, targets } from "../tools/make-qr.mjs";

const C = core();
const ctx = (f) => vm.runInThisContext(fs.readFileSync(new URL("../" + f, import.meta.url), "utf8"));
ctx("js/messages.js");
ctx("js/samples.js");
const T = globalThis.QRText;
const items = globalThis.QRSamples.flatMap((g) => g.items);

test("サンプル: 書いてある判定と兆候のとおりになる", () => {
  for (const s of items) {
    const r = C.score(C.analyze(s.url));
    assert.equal(r.level, s.expect, `${s.id} ${r.total}`);
    assert.ok(r.signals.some((x) => x.id === s.signal), `${s.id} に ${s.signal} がない`);
  }
});

test("サンプル: ID と QR の番号が重ならない。例示用でないドメインは決まったものだけ", () => {
  assert.equal(new Set(items.map((s) => s.id)).size, items.length);
  const nums = items.filter((s) => s.qr).map((s) => s.qr);
  assert.equal(new Set(nums).size, nums.length);
  // 実在の TLD・サービスを使うのは、TLD・ホスティング・短縮 URL・公式の例だけ
  const real = items.map((s) => C.analyze(s.url)).filter((a) => a.kind === "url" && !/(^|\.)example(\.com)?$/.test(a.url.registrable || a.url.host))
    .map((a) => a.url.registrable || a.url.host).sort();
  assert.deepEqual(real, ["192.168.1.1", "amazon.co.jp", "bit.ly", "eki-net-login.pages.dev", "japanpost.jp", "vzqxkwtr.top"]);
});

test("samples/qr/ の画像は js/samples.js と同じ中身（画素で比べる）", () => {
  const list = targets();
  assert.equal(list.length, items.filter((s) => s.qr).length);
  for (const { file, sample } of list) {
    const got = readPixels(fs.readFileSync(new URL("../samples/qr/" + file, import.meta.url)));
    assert.ok(Buffer.compare(got.raw, pixels(sample.url).raw) === 0, file);
  }
  assert.deepEqual(fs.readdirSync(new URL("../samples/qr/", import.meta.url)).sort(), list.map((t) => t.file).sort());
});

test("出しうる兆候すべてに説明の文がある（detail を渡すと文字列になる）", () => {
  const src = fs.readFileSync(new URL("../js/url-core.js", import.meta.url), "utf8");
  // add("…") の形と、三項演算子で渡す idn・idn-mixed
  const ids = [...new Set([...src.matchAll(/add\("([a-z0-9-]+)"/g)].map((m) => m[1]).concat(["idn", "idn-mixed"]))];
  assert.ok(ids.length >= 30, String(ids.length));
  for (const id of ids) assert.equal(typeof T.signals[id], "function", id);
  // 実際の URL で出た兆候を、説明の文にしてみる（undefined や [object Object] が混じらない）
  const urls = [...items.map((s) => s.url), "https://xn--pckua2a7gp15o89zb.com/", "http://0x7f000001:8080/a%252e",
    "https://a.b.c.d.example.com/" + "x".repeat(160)];
  for (const u of urls) {
    for (const s of C.score(C.analyze(u)).signals) {
      const text = T.signals[s.id](s.detail, s.points);
      assert.ok(typeof text === "string" && !/undefined|\[object/.test(text), `${s.id}: ${text}`);
    }
  }
});

test("確かさの表の説明が、model.js の評価の行とそろう", () => {
  assert.deepEqual(Object.keys(T.evaluation), globalThis.QRModel.evaluation.map((e) => e.id));
});

test("PNG の CRC-32 は既知の検査値と一致する（\"123456789\" → cbf43926）", async () => {
  const { crc32 } = await import("../tools/make-qr.mjs");
  assert.equal(crc32(Buffer.from("123456789", "ascii")).toString(16), "cbf43926");
});
