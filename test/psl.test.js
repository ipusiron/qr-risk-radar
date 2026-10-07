import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { domainToASCII } from "node:url";
import { read, core } from "./load.js";
import { render } from "../tools/build-psl.mjs";

const C = core();

test("PSL のデータは tools/public_suffix_list.dat から作り直すと同じ（手で編集していない）", () => {
  const src = fs.readFileSync(new URL("../tools/public_suffix_list.dat", import.meta.url), "utf8");
  assert.equal(render(src), read("js/psl-data.js"));
  assert.match(src, /This Source Code Form is subject to the terms of the Mozilla/);
  assert.ok(globalThis.QRPsl.icann.split(" ").length > 6000);
  assert.ok(globalThis.QRPsl.private.split(" ").length > 3000);
});

test("公式のテスト（publicsuffix/list の tests/test_psl.txt）の既知解答がすべて一致する", () => {
  const cases = [...read("test/test_psl.txt").matchAll(/^checkPublicSuffix\((null|'[^']*'), (null|'[^']*')\);/gm)];
  assert.ok(cases.length >= 70, String(cases.length));
  let checked = 0;
  for (const [, rawIn, rawOut] of cases) {
    if (rawIn === "null") continue;
    const input = rawIn.slice(1, -1);
    const want = rawOut === "null" ? null : rawOut.slice(1, -1);
    // ブラウザーの URL と同じく ASCII（Punycode）にしてから調べる。先頭がドットの名前は登録ドメインなし
    const ascii = input.startsWith(".") ? null : domainToASCII(input);
    const got = ascii ? C.registrableDomain(ascii) : null;
    assert.equal(got, want === null ? null : domainToASCII(want), input);
    checked++;
  }
  assert.ok(checked >= 70);
});

test("公開接尾辞の区分: 利用者が自由にサブドメインを作れるサービスは PRIVATE", () => {
  assert.deepEqual(C.publicSuffix("www.example.co.jp"), { suffix: "co.jp", section: "icann" });
  assert.equal(C.publicSuffix("evil.pages.dev").section, "private");
  assert.equal(C.registrableDomain("evil.pages.dev"), "evil.pages.dev");
  assert.equal(C.publicSuffix("someone.github.io").section, "private");
  assert.equal(C.registrableDomain("a.b.uffzuoynym.top"), "uffzuoynym.top");
  assert.equal(C.publicSuffix("example.invalidtld").section, "default");
  assert.equal(C.registrableDomain("co.jp"), null);
});

test("Punycode の復号（RFC 3492 の例と Node の domainToUnicode が一致）", async () => {
  const { domainToUnicode } = await import("node:url");
  assert.equal(C.decodePunycodeLabel("xn--pple-43d"), "аpple");
  for (const host of ["xn--pple-43d.com", "xn--wgv71a119e.jp", "www.xn--fiqs8s.cn", "xn--n3h.example", "example.com"]) {
    assert.equal(C.hostToUnicode(host), domainToUnicode(host), host);
  }
  assert.equal(C.hostToUnicode("xn--!!.com"), "xn--!!.com");
});
