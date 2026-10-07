import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

for (const f of ["js/payload-core.js", "js/messages.js"]) vm.runInThisContext(fs.readFileSync(new URL("../" + f, import.meta.url), "utf8"));
const P = globalThis.QRPayload;
const T = globalThis.QRText;
const fields = (r) => Object.fromEntries(r.fields.map((f) => [f.key, f.value]));

test("Wi-Fi: エスケープ（\\; \\: \\\\）を戻し、暗号方式・隠しネットワークを注意にする", () => {
  const r = P.parse(String.raw`WIFI:T:WPA;S:My\;Cafe;P:p\:ss\\w;H:true;;`);
  assert.equal(r.type, "wifi");
  assert.deepEqual(fields(r), { ssid: "My;Cafe", security: "WPA", password: "p:ss\\w", hidden: "true" });
  assert.equal(r.fields.find((f) => f.key === "password").secret, true);
  assert.deepEqual(r.notes, ["wifi-hidden", "wifi-check"]);
  const open = P.parse("WIFI:S:FreeNet;;");
  assert.deepEqual(fields(open), { ssid: "FreeNet", security: "nopass" });
  assert.deepEqual(open.notes, ["wifi-open", "wifi-check"]);
  assert.deepEqual(P.parse("WIFI:T:WEP;S:Old;P:12345;;").notes, ["wifi-wep", "wifi-check"]);
  assert.deepEqual(P.parse("wifi:T:nopass;S:Lobby;;").notes, ["wifi-open", "wifi-check"]);
});

test("電話: 0570・0180（+81 の形も）は有料の案内番号、+81 以外の + は海外", () => {
  assert.deepEqual(P.parse("tel:0570-000-000").notes, ["tel-paid", "tel-check"]);
  assert.deepEqual(P.parse("tel:+81570123456").notes, ["tel-paid", "tel-check"]);
  assert.deepEqual(P.parse("tel:0180-99-1234").notes, ["tel-paid", "tel-check"]);
  assert.deepEqual(P.parse("tel:+1-202-555-0100").notes, ["tel-intl", "tel-check"]);
  assert.deepEqual(P.parse("tel:03-1234-5678").notes, ["tel-check"]);
  assert.deepEqual(P.parse("tel:0120-000-000").notes, ["tel-check"]);
  assert.equal(fields(P.parse("tel:%2B81-3-1234-5678")).number, "+81-3-1234-5678");
});

test("SMS: SMSTO の形と sms:?body= の形。本文の URL を取り出す", () => {
  const a = P.parse("SMSTO:+819000000000:Delivery failed https://sagawa-redelivery.example/a");
  assert.equal(a.type, "sms");
  assert.deepEqual(fields(a), { number: "+819000000000", body: "Delivery failed https://sagawa-redelivery.example/a" });
  assert.deepEqual(a.urls, ["https://sagawa-redelivery.example/a"]);
  const b = P.parse("sms:+819011112222?body=Hi%20https%3A%2F%2Fx.example%2F");
  assert.deepEqual(fields(b), { number: "+819011112222", body: "Hi https://x.example/" });
  assert.deepEqual(b.urls, ["https://x.example/"]);
  assert.deepEqual(P.parse("sms:0570000000").notes, ["tel-paid", "sms-check"]);
});

test("メール: mailto: と MATMSG:。本文の URL は末尾の句読点を外す", () => {
  const a = P.parse("mailto:a@example.com?subject=Hello&body=See%20https://x.example/p.");
  assert.deepEqual(fields(a), { to: "a@example.com", subject: "Hello", body: "See https://x.example/p." });
  assert.deepEqual(a.urls, ["https://x.example/p"]);
  const b = P.parse("MATMSG:TO:a@example.com;SUB:Hi;BODY:x\\;y;;");
  assert.deepEqual(fields(b), { to: "a@example.com", subject: "Hi", body: "x;y" });
});

test("連絡先: vCard の行の折り返しを戻し、MECARD の姓,名を並べ直す", () => {
  const vcard = ["BEGIN:VCARD", "VERSION:3.0", "FN:Taro Yamada", "ORG:Example Inc.;Sales", "TEL;TYPE=CELL:+81-90-0000-0000",
    "EMAIL:taro@example.com", "URL:https://www.example.com/taro", "NOTE:See https://evil.exam", " ple/login", "END:VCARD"].join("\r\n");
  const a = P.parse(vcard);
  assert.equal(a.type, "contact");
  assert.deepEqual(fields(a), { name: "Taro Yamada", org: "Example Inc. Sales", tel: "+81-90-0000-0000", email: "taro@example.com",
    url: "https://www.example.com/taro", note: "See https://evil.example/login" });
  assert.deepEqual(a.urls, ["https://www.example.com/taro", "https://evil.example/login"]);
  assert.deepEqual(a.notes, ["contact-urls"]);
  const b = P.parse("MECARD:N:Yamada,Taro;TEL:0570000000;URL:https://a.example/;;");
  assert.deepEqual(fields(b), { name: "Taro Yamada", tel: "0570000000", url: "https://a.example/" });
  assert.deepEqual(b.notes, ["contact-urls", "tel-paid"]);
});

test("位置・2段階認証・暗号資産・予定・アプリ", () => {
  assert.deepEqual(fields(P.parse("geo:35.6812,139.7671?q=Tokyo%20Station")), { lat: "35.6812", lon: "139.7671", label: "Tokyo Station" });
  // Google Authenticator の Key Uri Format の例
  const otp = P.parse("otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example");
  assert.equal(otp.type, "otp");
  assert.deepEqual(fields(otp), { otpType: "totp", issuer: "Example", account: "alice@google.com", secret: "JBSWY3DPEHPK3PXP" });
  assert.equal(otp.fields.find((f) => f.key === "secret").secret, true);
  assert.deepEqual(otp.notes, ["otp-secret"]);
  // BIP 21 の例
  const btc = P.parse("bitcoin:175tWpb8K1S7NmH4Zx6rewF9WQrcZv245W?amount=20.3&label=Luke-Jr");
  assert.deepEqual(fields(btc), { currency: "bitcoin", address: "175tWpb8K1S7NmH4Zx6rewF9WQrcZv245W", amount: "20.3", label: "Luke-Jr" });
  assert.deepEqual(btc.notes, ["crypto-irreversible"]);
  const ev = P.parse(["BEGIN:VEVENT", "SUMMARY:Seminar", "DTSTART:20261101T100000", "LOCATION:Room 1", "URL:https://events.example/s",
    "END:VEVENT"].join("\n"));
  assert.deepEqual(fields(ev), { summary: "Seminar", start: "20261101T100000", location: "Room 1", url: "https://events.example/s" });
  assert.deepEqual(ev.urls, ["https://events.example/s"]);
  const intent = P.parse("intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;"
    + "S.browser_fallback_url=https%3A%2F%2Fexample.com%2Finstall;end");
  assert.deepEqual(fields(intent), { package: "com.google.zxing.client.android", scheme: "zxing", fallback: "https://example.com/install" });
  assert.deepEqual(intent.urls, ["https://example.com/install"]);
  assert.deepEqual(fields(P.parse("market://details?id=com.example.app")), { package: "com.example.app" });
  assert.deepEqual(fields(P.parse("itms-apps://apps.apple.com/app/id1234567890")), { appId: "1234567890" });
});

test("スクリプトと文の中の URL。URL そのもの・URL のない文は対象外", () => {
  const s = P.parse("javascript:window.location='http://192.168.1.1:8080/malware.exe'");
  assert.deepEqual([s.type, s.urls], ["script", ["http://192.168.1.1:8080/malware.exe"]]);
  const t = P.parse("こんにちは。詳しくは https://a.example/x。");
  assert.deepEqual([t.type, t.urls], ["text", ["https://a.example/x"]]);
  for (const x of ["https://a.example/", "hello", "", null, "javascript:alert(1)", "data:text/html,<h1>x</h1>"]) assert.equal(P.parse(x), null, String(x));
});

test("種類・項目・注意のすべてに文言がある", () => {
  const src = fs.readFileSync(new URL("../js/payload-core.js", import.meta.url), "utf8");
  const types = [...new Set([...src.matchAll(/type: "([a-z]+)"/g)].map((m) => m[1]))];
  const keys = [...new Set([...src.matchAll(/key: "([a-zA-Z]+)"/g), ...src.matchAll(/\["[a-z]+", "([a-zA-Z]+)"\]/g)].map((m) => m[1]))];
  const notes = [...new Set([...src.matchAll(/"([a-z]+-[a-z]+)"/g)].map((m) => m[1]))];
  assert.ok(types.length >= 12 && notes.length >= 16, `${types.length} ${notes.length}`);
  for (const t of types) assert.equal(typeof T.payload.types[t], "string", t);
  assert.ok(keys.length >= 20, String(keys.length));
  for (const k of keys) assert.equal(typeof T.payload.fields[k], "string", k);
  // このファイルの入力を実際に読み解いて出た種類・項目・注意も照合する（add("name", …) や対応表から付く項目を含む）
  const inputs = [...fs.readFileSync(new URL(import.meta.url), "utf8").matchAll(/P\.parse\((?:String\.raw)?[`"]([^`"]+)[`"]\)/g)].map((m) => m[1]);
  assert.ok(inputs.length >= 20, String(inputs.length));
  for (const r of inputs.map((x) => P.parse(x)).filter(Boolean)) {
    assert.equal(typeof T.payload.types[r.type], "string", r.type);
    for (const f of r.fields) assert.equal(typeof T.payload.fields[f.key], "string", f.key);
    for (const n of r.notes) assert.equal(typeof T.payload.notes[n], "string", n);
  }
  for (const n of notes) assert.equal(typeof T.payload.notes[n], "string", n);
  assert.equal(T.payload.value("security", "nopass"), "なし（暗号化されていない）");
  assert.equal(T.payload.mask(16), "••••••••（16文字）");
});
