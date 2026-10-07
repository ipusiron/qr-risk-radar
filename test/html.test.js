import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const html = read("index.html");
const app = read("app.js");
const css = read("style.css");

const CSP = ["default-src 'none'", "script-src 'self'", "style-src 'self'", "img-src 'self' data: blob:", "media-src 'self' blob:",
  "worker-src blob:", "base-uri 'none'", "form-action 'none'", "object-src 'none'"].join("; ");

test("CSP: 外部のサーバーを許さない。meta と .htaccess で同じ値", () => {
  assert.ok(html.includes(`<meta http-equiv="Content-Security-Policy" content="${CSP}" />`));
  assert.ok(read(".htaccess").includes(`Content-Security-Policy "${CSP}; frame-ancestors 'none'"`));
  assert.ok(!/unsafe-inline|unsafe-eval|https?:\/\/[^"]*\.(?:com|net|org)[^"]*;/.test(CSP));
});

test("HTML: スクリプトはすべて同じ場所から、決まった順で読む。インラインのスクリプト・style 属性・on 属性なし", () => {
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
  assert.deepEqual(scripts.map((m) => (m[1].match(/src="([^"]+)"/) || [])[1]), [
    "js/psl-data.js", "js/model.js", "js/url-core.js", "js/payload-core.js", "js/messages.js", "js/samples.js",
    "vendor/qr-scanner/qr-scanner.umd.min.js", "js/qr-worker.js", "vendor/qrcode-generator/qrcode.js", "app.js"]);
  for (const m of scripts) {
    assert.equal(m[2].trim(), "", "インラインのスクリプト");
    assert.ok(fs.existsSync(new URL("../" + m[1].match(/src="([^"]+)"/)[1], import.meta.url)));
  }
  assert.ok(!/\sstyle=/.test(html), "style 属性");
  assert.ok(!/\son[a-z]+=/.test(html), "on 属性");
  assert.ok(!/<style/.test(html));
  // 外へのリンクは GitHub の1つだけで、rel に noopener noreferrer
  const links = [...html.matchAll(/(?:href|src)="(https?:[^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(links, ["https://github.com/ipusiron/qr-risk-radar"]);
  assert.ok(/href="https:\/\/github.com\/ipusiron\/qr-risk-radar" target="_blank" rel="noopener noreferrer"/.test(html));
});

test("app.js: 参照する ID がすべて index.html にある。innerHTML・eval・console.log を使わない", () => {
  const ids = [...new Set([...app.matchAll(/\$\("([A-Za-z-]+)"\)/g)].map((m) => m[1]))];
  assert.ok(ids.length > 20);
  for (const id of ids) assert.ok(html.includes(`id="${id}"`), id);
  assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function|console\.log/.test(app));
});

test("タブ: role と aria-controls の組がそろう", () => {
  for (const [tab, panel] of [["tab-manual", "panel-manual"], ["tab-qr", "panel-qr"]]) {
    assert.ok(new RegExp(`role="tab" id="${tab}" aria-controls="${panel}"`).test(html), tab);
    assert.ok(new RegExp(`id="${panel}" class="panel" role="tabpanel" aria-labelledby="${tab}"`).test(html), panel);
  }
  assert.ok(html.includes('id="result" class="result" aria-live="polite"'));
});

// ---------- 配色のコントラスト比（WCAG 2.x の式） ----------
function tokens(block) {
  return Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}
function luminance(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

test("配色: 文字と背景の組み合わせはライト・ダークとも 4.5:1 以上、フォーカスの枠は 3:1 以上", () => {
  const light = tokens(css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {"))));
  const darkStart = css.indexOf("@media (prefers-color-scheme: dark)");
  const dark = { ...light, ...tokens(css.slice(darkStart, css.indexOf("}", css.indexOf(":root {", darkStart)))) };
  assert.equal(Object.keys(light).length, 23);
  assert.notEqual(dark.bg, light.bg);
  const TEXT = [["text", "bg"], ["text", "surface"], ["text", "code-bg"], ["muted", "surface"], ["muted", "bg"], ["accent-text", "accent"],
    ["header-text", "header-1"], ["header-text", "header-2"], ["high-fg", "high-bg"], ["medium-fg", "medium-bg"], ["low-fg", "low-bg"],
    ["trusted-fg", "trusted-bg"], ["none-fg", "none-bg"], ["error", "surface"]];
  for (const [name, t] of [["light", light], ["dark", dark]]) {
    for (const [fg, bg] of TEXT) assert.ok(contrast(t[fg], t[bg]) >= 4.5, `${name} ${fg}/${bg} ${contrast(t[fg], t[bg]).toFixed(2)}`);
    for (const bg of ["bg", "surface"]) assert.ok(contrast(t.focus, t[bg]) >= 3, `${name} focus/${bg}`);
  }
});

test("押せるものは高さ44px以上", () => {
  assert.ok(/\.btn \{[^}]*min-height: 44px/.test(css));
  assert.ok(/\.tab \{[^}]*min-height: 48px/.test(css));
  assert.ok(/\.sample \{[^}]*min-height: 44px/.test(css));
  assert.ok(!/\.btn\.small \{[^}]*min-height: (?:[0-3]?\d|4[0-3])px/.test(css));
});
