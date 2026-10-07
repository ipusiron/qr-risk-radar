// js/samples.js のうち qr の番号があるサンプルを、samples/qr/NN_id.png に書き出す（読み取りの試験・訓練の資料用）
// 使い方: node tools/make-qr.mjs [--check]（--check は書き出さず、画素が js/samples.js と一致するかだけ確かめる）
// QR の生成は画面と同じ vendor/qrcode-generator（誤り訂正 M、UTF-8）。PNG は8ビットのグレースケールで自前に組み立てる
import fs from "node:fs";
import vm from "node:vm";
import zlib from "node:zlib";
import { pathToFileURL } from "node:url";

const ROOT = new URL("../", import.meta.url);
const OUT = new URL("samples/qr/", ROOT);
for (const f of ["vendor/qrcode-generator/qrcode.js", "js/samples.js"]) vm.runInThisContext(fs.readFileSync(new URL(f, ROOT), "utf8"));
const qrcode = globalThis.qrcode;
qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

const CELL = 8, MARGIN = 4;

// 画素（1行ごとに先頭へフィルターの種類0を置いた形）
export function pixels(text) {
  const qr = qrcode(0, "M");
  qr.addData(text, "Byte");
  qr.make();
  const n = qr.getModuleCount(), size = (n + MARGIN * 2) * CELL;
  const raw = Buffer.alloc((size + 1) * size, 255);
  for (let y = 0; y < size; y++) {
    raw[y * (size + 1)] = 0;
    const r = Math.floor(y / CELL) - MARGIN;
    for (let x = 0; x < size; x++) {
      const c = Math.floor(x / CELL) - MARGIN;
      if (r >= 0 && r < n && c >= 0 && c < n && qr.isDark(r, c)) raw[y * (size + 1) + 1 + x] = 0;
    }
  }
  return { size, raw };
}

const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
export function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png({ size, raw }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}
// PNG から画素を取り出す（この形式で書いたものだけを読む）
export function readPixels(buf) {
  let p = 8, size = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString("ascii", p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") size = data.readUInt32BE(0);
    if (type === "IDAT") idat.push(data);
    p += 12 + len;
  }
  return { size, raw: zlib.inflateSync(Buffer.concat(idat)) };
}

export const targets = () => globalThis.QRSamples.flatMap((g) => g.items).filter((s) => s.qr)
  .sort((a, b) => a.qr - b.qr).map((s) => ({ file: `${String(s.qr).padStart(2, "0")}_${s.id}.png`, sample: s }));

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const check = process.argv.includes("--check");
  let bad = 0;
  if (!check) fs.mkdirSync(OUT, { recursive: true });
  for (const { file, sample } of targets()) {
    const want = pixels(sample.url);
    const path = new URL(file, OUT);
    if (check) {
      const ok = fs.existsSync(path) && Buffer.compare(readPixels(fs.readFileSync(path)).raw, want.raw) === 0;
      if (!ok) { bad++; console.log("差分あり:", file); }
    } else {
      fs.writeFileSync(path, png(want));
      console.log("wrote", file, `${want.size}px`);
    }
  }
  if (check) { console.log(bad ? `${bad}件が古い` : "一致"); process.exitCode = bad ? 1 : 0; }
}
