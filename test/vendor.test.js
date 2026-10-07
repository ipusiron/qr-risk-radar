import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { render as renderWorker } from "../tools/build-worker.mjs";

const read = (f) => fs.readFileSync(new URL("../" + f, import.meta.url));
const sha256 = (f) => crypto.createHash("sha256").update(read(f)).digest("hex");

// npm の配布物（qr-scanner@1.4.2・qrcode-generator@2.0.4）から取り出したときのハッシュ。vendor/README.md を参照
const VENDOR = {
  "vendor/qr-scanner/qr-scanner.umd.min.js": "40aa3fe4e1083073d7898c0895e98d5aa4d469a5c1aab6f357c0284ef75b413d",
  "vendor/qr-scanner/qr-scanner.umd.min.js.map": "1734292a1dc3e17b2e92b510d9703f4cb406a9e50cf4ad05bc2909f8bab330b0",
  "vendor/qr-scanner/qr-scanner-worker.min.js": "f4d8445f5a15c4e5f71a8c8c062c6443f09db370b8d3fe1fbdc7fe7889630d14",
  "vendor/qr-scanner/qr-scanner-worker.min.js.map": "61db776665639ad3e6618d802ff8ea1f55c20eb6b8cb14a54318a65a7740ae2f",
  "vendor/qr-scanner/LICENSE": "f9e6b44d80d0eb44442c7e66af8a756709a61e4d9adf0a54b8951a92ece734e2",
  "vendor/qrcode-generator/qrcode.js": "79ec86f82856005b1c887905cfccfcfbec3821ca61c7fd5a952faa5f778f791c",
  "vendor/qrcode-generator/LICENSE": "3a850fa5f08101db6f40676c2786e10bd2cd5fff7b12ffdf1e0c434d4e49d90c",
};

test("vendor/ のファイルは配布物と同じ（1バイトも変えていない）", () => {
  for (const [f, hash] of Object.entries(VENDOR)) assert.equal(sha256(f), hash, f);
});

test("js/qr-worker.js は vendor のデコーダーから作った最新のもの（export を外しただけ）", () => {
  const src = read("vendor/qr-scanner/qr-scanner-worker.min.js").toString("utf8");
  assert.equal(read("js/qr-worker.js").toString("utf8"), renderWorker(src));
  // 中身の式は元のファイルの部分文字列そのもの
  const expr = renderWorker(src).match(/createWorker: ([\s\S]*) \};\n$/)[1];
  assert.ok(src.includes(expr));
});
