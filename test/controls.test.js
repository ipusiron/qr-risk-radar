import test from "node:test";
import assert from "node:assert/strict";
import { core } from "./load.js";

const C = core();
const ch = (cp) => String.fromCodePoint(cp);
const RLO = ch(0x202e), ZWSP = ch(0x200b), CR = ch(13), LF = ch(10), BS = ch(92);
const ids = (r) => r.signals.map((s) => s.id);

test("向きを変える文字・見えない文字を兆候にする。URL では点が付き、URL でない中身では参考（0点）", () => {
  const rlo = C.score(C.analyze("https://files.example/invoice" + RLO + "fdp.exe"));
  assert.deepEqual(rlo.signals.find((s) => s.id === "bidi").detail.chars, ["RLO U+202E"]);
  assert.equal(rlo.signals.find((s) => s.id === "bidi").points, 4);
  assert.equal(rlo.level, "high");
  // ホスト名の中のゼロ幅スペースは URL の解析で消えるが、元の文字列で数える
  const zw = C.score(C.analyze("https://login" + ZWSP + "-check.example/"));
  assert.equal(zw.url.host, "login-check.example");
  assert.equal(zw.signals.find((s) => s.id === "invisible").points, 3);
  assert.equal(zw.level, "high");
  const wifi = C.score(C.analyze("WIFI:T:nopass;S:Free" + RLO + "WiFi;;"));
  assert.ok(ids(wifi).includes("bidi"));
  assert.ok(wifi.signals.every((s) => s.points === 0));
  // 改行・TAB は数えない。タグ文字・C0 の制御文字（CR・LF・TAB 以外）は見えない文字
  assert.ok(!ids(C.analyze("line1" + LF + "line2" + CR + LF + "a\tb")).some((i) => i === "invisible" || i === "bidi"));
  const tag = C.analyze("https://example.com/" + ch(0xe0041) + ch(0x1b));
  assert.deepEqual(tag.signals.find((s) => s.id === "invisible").detail.chars, ["TAG U+E0041", "ESC U+001B"]);
});

test("表示用の印: 制御文字を [名前 U+XXXX] に置き換え、ほかの文字はそのまま", () => {
  assert.equal(C.labelControls("invoice" + RLO + "fdp.exe"), "invoice[RLO U+202E]fdp.exe");
  assert.equal(C.labelControls("a" + ZWSP + ZWSP + "b"), "a[ZWSP U+200B][ZWSP U+200B]b");
  assert.equal(C.labelControls("日本語 аpple" + LF + "x"), "日本語 аpple" + LF + "x");
  assert.deepEqual(C.splitControls("x" + RLO), [{ text: "x" }, { name: "RLO", code: "U+202E", kind: "bidi" }]);
  for (const [cp, name] of [[0x202a, "LRE"], [0x2066, "LRI"], [0x200f, "RLM"], [0xfeff, "BOM"], [0xad, "SHY"], [0x3164, "HF"], [0, "NUL"], [0x9f, "CTRL"]]) {
    assert.equal(C.splitControls(ch(cp))[0].name, name, cp.toString(16));
  }
});

test("Day023 へのリンク: # の後ろに入れ、ASCII だけの中身は出さず、CR はエスケープの形で渡す", () => {
  assert.equal(C.inspectorUrl("https://example.com/login"), null);
  assert.equal(C.inspectorUrl(""), null);
  const a = new URL(C.inspectorUrl("https://files.example/invoice" + RLO + "fdp.exe"));
  assert.equal(a.origin + a.pathname, "https://ipusiron.github.io/weirdstring-inspector/");
  assert.equal(a.search, "");
  const p = new URLSearchParams(a.hash.slice(1));
  assert.deepEqual([p.get("text"), p.get("source")], ["https://files.example/invoice" + RLO + "fdp.exe", "qr-risk-radar"]);
  // CR と \ を含むときは v=2&mode=escape（Day023 の decodeEscapes で元に戻る形）
  const vcard = "BEGIN:VCARD" + CR + LF + "FN:A" + BS + "B " + ch(0x5c71) + CR + LF + "END:VCARD";
  const b = new URLSearchParams(new URL(C.inspectorUrl(vcard)).hash.slice(1));
  assert.deepEqual([b.get("v"), b.get("mode"), b.get("source")], ["2", "escape", null]);
  assert.equal(b.get("text"), "BEGIN:VCARD" + BS + "r" + LF + "FN:A" + BS + BS + "B " + ch(0x5c71) + BS + "r" + LF + "END:VCARD");
  // Day023 の decodeEscapes と同じ規則で戻すと元の文字列になる
  const decode = (s) => s.replace(/\\(\\|r)/g, (m, c) => (c === "r" ? CR : BS));
  assert.equal(decode(b.get("text")), vcard);
});
