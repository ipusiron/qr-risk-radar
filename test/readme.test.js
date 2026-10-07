import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { core } from "./load.js";

const C = core();
const M = globalThis.QRModel;
const root = (f) => new URL("../" + f, import.meta.url);
const read = (f) => fs.readFileSync(root(f), "utf8");
vm.runInThisContext(read("js/messages.js"));
vm.runInThisContext(read("js/samples.js"));
const T = globalThis.QRText;
const README = read("README.md");
const SCORING = read("SCORING.md");
const DOCS = { "README.md": README, "SCORING.md": SCORING, "SECURITY.md": read("SECURITY.md") };

// Markdown の表を、見出しの行で探して行の配列（セルの配列）にする
function table(md, header) {
  const lines = md.split("\n");
  const i = lines.indexOf(header);
  assert.ok(i >= 0, "表が見つからない: " + header);
  const rows = [];
  for (let j = i + 2; j < lines.length && lines[j].startsWith("|"); j++) rows.push(lines[j].slice(1, -1).split(" | ").map((c) => c.trim()));
  assert.ok(rows.length > 0, header);
  return rows;
}
const unquote = (s) => s.replace(/^`|`$/g, "");
// 画面と同じ段階と、URL なら点数（app.js の displayLevel と同じ規則）
function judge(u) {
  const a = C.analyze(u), s = C.score(a);
  const level = a.kind === "text" ? "text" : a.kind === "scheme" && s.level !== "high" ? "other" : s.level;
  return T.level[level] + (a.kind === "url" ? `（${s.total}点）` : "");
}
const pct = (v) => `${v.toFixed(1)}%`;
const evalName = (e) => (e.id === "legit" ? "公式のログインページ" : T.evaluation[e.id].name);

test("判定の確かさの表（README・SCORING.md）が js/model.js と一致する", () => {
  for (const md of [README, SCORING]) {
    const rows = table(md, "| データ | 件数 | 中以上 | 高 | 意味 |");
    assert.deepEqual(rows, M.evaluation.map((e) => [evalName(e), e.n.toLocaleString("ja-JP"), pct(e.medium), pct(e.high),
      T.evaluation[e.id].kind === "phish" ? "見抜けた割合" : "誤って疑った割合"]));
    const miss = (100 - M.evaluation.find((e) => e.id === "jpcert").medium).toFixed(1);
    assert.ok(md.includes(`${miss}%`), miss);
  }
  assert.ok(README.includes(`合計が${M.medium}点以上で「中」、${M.high}点以上で「高」`));
  assert.ok(SCORING.includes(`合計が${M.medium}点以上なら「中」、${M.high}点以上なら「高」`));
  assert.ok(SCORING.includes(`学習用のフィッシングURL ${M.training.phishing.toLocaleString("ja-JP")}件、実在サイト${M.training.benign}件`));
});

test("SCORING.md の兆候と TLD の表が js/model.js と一致する", () => {
  const how = (s) => s.replace("data", "データ").replace("rule", "規則").replace("+cap1", "（上限1）").replace("+cap2", "（上限2）");
  const rows = table(SCORING, "| 兆候 | ID | 点 | フィッシング | 実在サイト | 決め方 |");
  assert.deepEqual(rows.map((r) => unquote(r[1])).sort(), Object.keys(M.stats).sort());
  for (const r of rows) {
    const id = unquote(r[1]), s = M.stats[id];
    assert.deepEqual(r.slice(2), [String(M.points[id] || 0), String(s.phish), String(s.benign), how(s.source)], id);
  }
  const tld = table(SCORING, "| TLD | 点 | フィッシング | 実在サイト |");
  assert.deepEqual(tld.map((r) => r[0]).sort(), Object.keys(M.tldPoints).map((t) => "." + t).sort());
  for (const r of tld) {
    const t = r[0].slice(1);
    assert.deepEqual(r.slice(1), [String(M.tldPoints[t]), String(M.tldStats[t].phish), String(M.tldStats[t].benign)], t);
  }
  assert.ok(README.includes(`${Object.keys(M.stats).length}種類の兆候`));
  const brands = C.BRANDS.length, official = C.BRANDS.flatMap((b) => b.official).length;
  for (const md of [README, SCORING]) assert.ok(md.includes(`${brands}ブランド`) && md.includes(`公式の登録ドメイン${official}件`));
});

test("README のサンプルの表が js/samples.js と計算部の判定に一致する（実物の文字のまま）", () => {
  const items = globalThis.QRSamples.flatMap((g) => g.items.map((s) => ({ ...s, group: g.group })));
  const rows = table(README, "| 分類 | サンプル | 中身 | 判定 |");
  assert.deepEqual(rows, items.map((s) => [s.group, s.title, "`" + s.url + "`", judge(s.url)]));
  assert.ok(README.includes(`ある${items.length}個です`) && README.includes(`手口ごとに${items.length}個`));
  // samples/qr/ と test/qr/ の表: ファイルが実在し、判定は中身から計算したもの
  const qr = README.split("### 読み取りの試験に使えるQRコードの画像")[1];
  const lists = [table(qr, "| ファイル | 中身 | 判定 |"), table(qr.split("`test/qr/`にも")[1], "| ファイル | 中身 | 判定 |")];
  assert.deepEqual(lists[0].map((r) => unquote(r[0])), fs.readdirSync(root("samples/qr/")).sort().map((f) => "samples/qr/" + f));
  for (const r of [...lists[0], ...lists[1]]) {
    for (const f of r[0].split("・").map(unquote)) {
      const path = f.startsWith(".") ? unquote(r[0].split("・")[0]).replace(/\.png$/, f) : f;
      assert.ok(fs.existsSync(root(path)), path);
    }
    assert.equal(r[2], judge(unquote(r[1])), r[1]);
  }
  assert.equal(lists[1].length * 2, fs.readdirSync(root("test/qr/")).length);
  // キリル文字の実物が残っている（エスケープや置き換えで消えていない）
  assert.ok(README.includes("https://" + String.fromCodePoint(0x430) + "pple.example/"));
});

test("README の YAML メタデータの構造と固定の値", () => {
  const yaml = README.slice(0, README.indexOf("-->"));
  assert.ok(README.startsWith("<!--\n---\nid: day074\nslug: qr-risk-radar\n"));
  for (const [k, v] of [["title", '"QR Risk Radar"'], ["repo_url", '"https://github.com/ipusiron/qr-risk-radar"'],
    ["demo_url", '"https://ipusiron.github.io/qr-risk-radar/"'], ["hub", "true"], ["difficulty", "2"]]) {
    assert.ok(new RegExp(`^${k}: ${v.replace(/[.?/]/g, "\\$&")}$`, "m").test(yaml), k);
  }
  for (const k of ["category_ja", "category_en", "tags"]) assert.ok(new RegExp(`^${k}:\\n  - `, "m").test(yaml), k);
  for (const k of ["subtitle_ja", "subtitle_en", "description_ja", "description_en"]) assert.ok(new RegExp(`^${k}: ".+"$`, "m").test(yaml), k);
});

test("README の構成: 前半と後半の見出しの順、画像の参照", () => {
  const h2 = [...README.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(h2.slice(0, 2), ["🌐 デモページ", "📸 スクリーンショット"]);
  assert.deepEqual(h2.slice(-4), ["📁 ディレクトリー構造", "💻 動作環境", "📄 ライセンス", "🛠️ このツールについて"]);
  assert.ok(README.includes("# QR Risk Radar - QRコードリスク分析ツール\n"));
  assert.ok(README.includes("**Day074 - 生成AIで作るセキュリティツール100**"));
  assert.ok(README.includes("🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)"));
  assert.equal((README.match(/img\.shields\.io/g) || []).length, 5);
  const images = [...README.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)].map((m) => m[1]);
  for (const f of images) assert.ok(fs.existsSync(root(f)), f);
  const pngs = fs.readdirSync(root("assets/")).filter((f) => f.endsWith(".png")).map((f) => "assets/" + f);
  assert.deepEqual([...new Set(images)].sort(), pngs.sort());
  // 見出しは「## 」の形、番号つきの箇条書きは「1. 」の形
  for (const [name, md] of Object.entries(DOCS)) {
    for (const line of md.split("\n")) {
      assert.ok(!/^#{1,6}[^#\s]/.test(line), `${name}: ${line}`);
      assert.ok(!/^\d+\.[^\s\d]/.test(line), `${name}: ${line}`);
    }
  }
});

test("ディレクトリー構造: リポジトリーの全ファイルが載り、全行に説明がある", () => {
  const block = README.split("```text\nqr-risk-radar/\n")[1].split("```")[0].trimEnd().split("\n");
  const listed = [], stack = [];
  for (const line of block) {
    const m = line.match(/^((?:│   |    )*)(?:├── |└── )(\S+)\s+# \S/);
    assert.ok(m, "説明のない行: " + line);
    const depth = m[1].length / 4;
    stack.length = depth;
    const name = m[2];
    if (name.endsWith("/")) stack.push(name.slice(0, -1));
    else listed.push([...stack, name].join("/"));
  }
  const cols = new Set(block.map((l) => l.indexOf(" # ")));
  assert.equal(cols.size, 1, "# の桁がそろっていない");
  const SKIP = new Set([".git", "node_modules", "corpus"]);
  const walk = (dir) => fs.readdirSync(root(dir), { withFileTypes: true }).flatMap((d) => {
    if (SKIP.has(d.name)) return [];
    const p = dir + d.name;
    return d.isDirectory() ? walk(p + "/") : [p];
  });
  const actual = walk("").filter((f) => !f.startsWith("tools/corpus/")).sort();
  assert.deepEqual(listed.sort(), actual);
});

test("表記: 日本語と英数字の間に空白を入れない。長音・ひらく語の決まり。強調は一節に2か所まで", () => {
  const JA = "[" + String.fromCodePoint(0x3041) + "-" + String.fromCodePoint(0x30ff) + String.fromCodePoint(0x4e00) + "-" + String.fromCodePoint(0x9fff) + "]";
  const space = new RegExp(`${JA} [A-Za-z0-9]|[A-Za-z0-9] ${JA}`);
  const banned = /分かる|分かり|全て|既に|無い|インターフェース|サーバ(?!ー)|ユーザ(?!ー)|ブラウザ(?!ー)|パラメータ(?!ー)|フォルダ(?!ー)|ディレクトリ(?!ー)/;
  for (const [name, md] of Object.entries(DOCS)) {
    let fence = false;
    for (const raw of md.split("\n")) {
      if (raw.startsWith("```")) { fence = !fence; continue; }
      if (fence || raw.startsWith("<!--")) continue;
      const line = raw.replace(/`[^`]*`/g, "x").replace(/\]\([^)]*\)/g, "]").replace(/^(\s*[-*>|]|\s*\d+\.|#+) /, "");
      assert.ok(!space.test(line), `${name}: ${raw}`);
      assert.ok(!banned.test(raw), `${name}: ${raw}`);
    }
    for (const sec of md.split(/^## /m).slice(1)) {
      const bold = (sec.match(/\*\*[^*]+\*\*/g) || []).length;
      assert.ok(bold <= 2, `${name}: ${sec.split("\n")[0]} の強調が${bold}か所`);
    }
  }
  // 箇条書きの先頭の項目名を太字にしない
  assert.ok(!/^- \*\*/m.test(README));
  // ATTACKS.md は以前からの読み物なので、長音・ひらく語の決まりだけを確かめる
  for (const line of read("ATTACKS.md").split("\n")) assert.ok(!banned.test(line), "ATTACKS.md: " + line);
});
