// 兆候の点数と、低・中・高の境目を学習用のデータで決め、学習に使っていないデータで測る
// 使い方: node tools/calibrate.mjs [--write]（--write で js/model.js を書き直す）
//
// データは tools/corpus/ に置く（リポジトリーには入れない。.gitignore 済み）。入手先:
//   crux_jp_202608.csv.gz … CrUX の日本の origin（2026年8月）
//       https://raw.githubusercontent.com/zakird/crux-top-lists/main/data/country/jp/202608.csv.gz
//   openphish_feed.txt     … OpenPhish の公開フィード（2026-10-07に取得した300件。フィードは毎日入れ替わる）
//       https://openphish.com/feed.txt
//   jpcert_202604.csv・jpcert_202605.csv … JPCERT/CC のフィッシング URL の一覧（2026年4月分・5月分）
//       https://raw.githubusercontent.com/JPCERTCC/phishurl-list/main/2026/202604.csv（202605.csv も同じ場所）
// URL は文字列として部品に分けるだけで、アクセスしない
import fs from "node:fs";
import vm from "node:vm";
import zlib from "node:zlib";

const ROOT = new URL("../", import.meta.url);
const CORPUS = new URL("./corpus/", import.meta.url);
const read = (f) => fs.readFileSync(new URL(f, CORPUS), "utf8");
const lines = (text) => text.trim().split(/\r?\n/);
for (const f of ["js/psl-data.js", "js/url-core.js"]) vm.runInThisContext(fs.readFileSync(new URL(f, ROOT), "utf8"));
const C = globalThis.QRRiskCore;

// ---------- データ ----------
// CrUX: Chrome の利用者が実際に開いたサイト（http か https かも実物）。rank は 1000・5000… の区切り
const cruxRows = lines(zlib.gunzipSync(fs.readFileSync(new URL("crux_jp_202608.csv.gz", CORPUS))).toString("utf8")).slice(1).map((l) => l.split(","));
const crux = cruxRows.filter(([, r]) => r === "1000").map(([o]) => o + "/").sort();
const crux5k = cruxRows.filter(([, r]) => r === "5000").map(([o]) => o + "/");
const openphish = lines(read("openphish_feed.txt")).filter(Boolean);
// JPCERT/CC の CSV は「日時,URL,ブランド」。URL にカンマが入ることがあるので、先頭と末尾の列で挟む
const jpcert = (f) => lines(read(f)).slice(1).map((l) => (l.match(/^[^,]+,(.*),([^,]*)$/) || [])[1]).filter(Boolean);
// CrUX はトップページだけなので、ログインのページを持つ実在のサービスを足す
const LEGIT = [
  "https://accounts.google.com/signin", "https://www.amazon.co.jp/ap/signin", "https://www.paypal.com/signin", "https://appleid.apple.com/",
  "https://github.com/login", "https://login.microsoftonline.com/", "https://www.facebook.com/login/", "https://x.com/i/flow/login",
  "https://login.yahoo.co.jp/config/login", "https://grp01.id.rakuten.co.jp/rms/nid/login", "https://www.smbc-card.com/mem/index.jsp",
  "https://www.mufg.jp/", "https://direct.bk.mufg.jp/", "https://www.jreast.co.jp/", "https://www.kuronekoyamato.co.jp/",
  "https://www.post.japanpost.jp/", "https://www.netflix.com/login", "https://www.docomo.ne.jp/", "https://www.au.com/", "https://www.softbank.jp/",
  "https://www.aeon.co.jp/", "https://www.saisoncard.co.jp/", "https://www.jcb.co.jp/", "https://jp.mercari.com/", "https://www.nta.go.jp/",
];
// 学習: JPCERT/CC 4月分＋OpenPhish の偶数番目／CrUX 上位1000の偶数番目＋ログインのページ。評価: それ以外
const sets = {
  trainPhish: [...jpcert("jpcert_202604.csv"), ...openphish.filter((_, i) => i % 2 === 0)],
  trainBenign: [...crux.filter((_, i) => i % 2 === 0), ...LEGIT],
  evalJpcert: jpcert("jpcert_202605.csv"),
  evalOpenphish: openphish.filter((_, i) => i % 2 === 1),
  evalCrux: crux.filter((_, i) => i % 2 === 1),
  evalCrux5k: crux5k,
  evalLegit: LEGIT,
};

// ---------- 兆候の点数 ----------
const analyzed = Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, v.map((u) => C.analyze(u))]));
const IDS = ["http", "ip-host", "userinfo", "port", "hosting", "shortener", "idn", "idn-mixed", "brand-other-tld", "brand-in-domain", "lookalike", "fake-official", "bait-domain",
  "brand-in-subdomain", "brand-in-path", "bait-subdomain", "bait-path", "hyphens", "deep-subdomain", "digits-mixed", "random-label", "download",
  "embedded-url", "double-encoding", "long"];
// パス・クエリを見る兆候（人気サイトのデータはトップページだけなので誤検知を測れない＝上限1点）
const PATH_SIGNALS = new Set(["brand-in-path", "bait-path", "download", "embedded-url", "long", "double-encoding"]);
// それだけで「中」にならないよう上限2点にする兆候（登録ドメインの形・ホスティング・http など、正規のサイトにもある特徴）
const CAP2 = new Set(["hyphens", "digits-mixed", "random-label", "deep-subdomain", "bait-subdomain", "hosting", "http", "brand-other-tld"]);
// データにほとんど出ない兆候は規則で決める（理由は SCORING.md の表に書く）
const EXPERT = { "userinfo": 4, "ip-host": 3, "idn-mixed": 4, "port": 1, "download": 1, "double-encoding": 1, "lookalike": 3,
  "shortener": 1, "embedded-url": 1, "fake-official": 4 };

const nP = sets.trainPhish.length, nB = sets.trainBenign.length;
const has = (r, id) => r.signals.some((s) => s.id === id);
const count = (list, id) => list.filter((r) => has(r, id)).length;
const stats = {}, points = {};
for (const id of IDS) {
  const a = count(analyzed.trainPhish, id);
  const b = count(analyzed.trainBenign, id);
  // フィッシングと実在サイトで、その兆候が出る割合の比（対数、0.5を足してならす）を四捨五入して0〜4点
  const lr = Math.log2(((a + 0.5) / (nP + 1)) / ((b + 0.5) / (nB + 1)));
  let p = Math.max(0, Math.min(4, Math.round(lr)));
  let source = "data";
  if (a < 10 && b < 10) { p = EXPERT[id] ?? Math.min(p, 2); source = "rule"; }
  if (PATH_SIGNALS.has(id)) { p = Math.min(p, 1); source += "+cap1"; }
  if (CAP2.has(id) && p > 2) { p = 2; source += "+cap2"; }
  stats[id] = { phish: a, benign: b, lr: Number(lr.toFixed(2)), points: p, source };
  points[id] = p;
}

// ---------- TLD ----------
const tldCount = (list) => {
  const c = {};
  for (const r of list) { const t = r.signals.find((s) => s.id === "tld"); if (t) c[t.detail.tld] = (c[t.detail.tld] || 0) + 1; }
  return c;
};
const tp = tldCount(analyzed.trainPhish), tb = tldCount(analyzed.trainBenign);
// 広く使われる TLD（com・net・org・jp）には点を付けない（国内のサイトとの割合の差が出ても、TLD だけで疑わない）
const GENERIC_TLD = new Set(["com", "net", "org", "jp"]);
const tldPoints = {};
for (const [tld, a] of Object.entries(tp)) {
  if (a < 15 || GENERIC_TLD.has(tld)) continue;
  const b = tb[tld] || 0;
  const lr = Math.log2(((a + 1) / (nP + 20)) / ((b + 1) / (nB + 20)));
  const p = Math.max(0, Math.min(2, Math.round(lr)));
  if (p > 0) tldPoints[tld] = p;
}

// ---------- 低・中・高の境目 ----------
const model = { points, tldPoints, medium: 0, high: 0 };
const bTotals = analyzed.trainBenign.map((r) => C.score(r, model).total);
const frac = (arr, t) => arr.filter((v) => v >= t).length / arr.length;
// 中: 2点以上で、学習用の実在サイトの5%以下が中以上になる最小の点（弱い兆候1つでは中にしない）。高: 1%以下になる最小の点
for (let t = 2; t <= 20; t++) if (!model.medium && frac(bTotals, t) <= 0.05) model.medium = t;
for (let t = model.medium + 1; t <= 30; t++) if (!model.high && frac(bTotals, t) <= 0.01) model.high = t;

// ---------- 評価（学習に使っていないデータで、中以上・高と判定した割合。%、小数1桁） ----------
const pct = (k, n) => Math.round((1000 * k) / n) / 10;
const evalRows = [
  ["jpcert", "evalJpcert", "JPCERT/CC phishurl-list 2026-05"],
  ["openphish", "evalOpenphish", "OpenPhish public feed 2026-10-07 (odd half)"],
  ["crux", "evalCrux", "CrUX Japan top 1000, 2026-08 (odd half)"],
  ["crux5k", "evalCrux5k", "CrUX Japan rank 1001-5000, 2026-08"],
  ["legit", "evalLegit", "Official login pages (25)"],
];
const evaluation = evalRows.map(([id, key, source]) => {
  const levels = analyzed[key].map((r) => C.score(r, model).level);
  const n = levels.length;
  const high = levels.filter((l) => l === "high").length;
  const medium = levels.filter((l) => l === "medium").length + high;
  return { id, source, n, medium: pct(medium, n), high: pct(high, n) };
});

console.log(JSON.stringify({ training: { phishing: nP, benign: nB }, stats, tldPoints, medium: model.medium, high: model.high }, null, 1));
console.table(evaluation);

if (process.argv.includes("--write")) {
  const out = {
    version: "2026-10-07",
    points: Object.fromEntries(Object.entries(points).filter(([, v]) => v > 0)),
    tldPoints, medium: model.medium, high: model.high,
    training: { phishing: nP, benign: nB },
    evaluation,
  };
  const text = [
    "// 生成物（tools/calibrate.mjs が学習用のデータから作る。手で編集しない）",
    "// 兆候ごとの点数・TLD の点数・低中高の境目と、学習に使っていないデータでの判定の割合（README の表と同じ値）",
    "globalThis.QRModel = " + JSON.stringify(out, null, 2) + ";",
    "",
  ].join("\n");
  fs.writeFileSync(new URL("js/model.js", ROOT), text);
  console.log("wrote js/model.js");
}
