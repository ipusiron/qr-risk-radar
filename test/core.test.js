import test from "node:test";
import assert from "node:assert/strict";
import { core } from "./load.js";

const C = core();
const M = globalThis.QRModel;
const judge = (u) => C.score(C.analyze(u));
const ids = (r) => r.signals.map((s) => s.id);

test("本物の公式サイトは「公式」と出て、兆候の点は0（ログインのパスがあっても）", () => {
  for (const u of ["https://www.paypal.com/signin", "https://accounts.google.com/signin", "https://www.amazon.co.jp/ap/signin",
    "https://www.dai-ichi-life.co.jp/", "https://login.yahoo.co.jp/config/login", "https://www.smbc-card.com/mem/index.jsp",
    "https://www.eki-net.com/", "https://member.rakuten-sec.co.jp/"]) {
    const r = judge(u);
    assert.equal(r.level, "low", u);
    assert.equal(r.total, 0, u + " " + ids(r));
    assert.ok(ids(r).includes("official"), u);
  }
});

test("偽装の典型は「高」: 公式ドメインの文字列の偽装・似た名前・@ の罠・混在した文字", () => {
  const cases = {
    "https://paypal.com.secure-login.tk/verify": ["fake-official", "bait-domain"],
    "https://rukansq.com/vpass.ne.jp/index.jsp": ["fake-official"],
    "https://g00gle.com/": ["lookalike"],
    "https://amaz0n.co.jp/signin": ["lookalike"],
    "http://www.google.com@evil.example/": ["userinfo"],
    "https://xn--pple-43d.com/": ["idn-mixed"],
  };
  for (const [u, want] of Object.entries(cases)) {
    const r = judge(u);
    assert.equal(r.level, "high", u + " " + r.total);
    for (const id of want) assert.ok(ids(r).includes(id), u + " " + id);
  }
});

test("危険なスキームは点に関係なく「高」。URL でない文字列は兆候なし", () => {
  for (const u of ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:msgbox(1)", "file:///C:/Windows/"]) {
    const r = judge(u);
    assert.equal(r.kind, "scheme");
    assert.equal(r.level, "high", u);
  }
  const t = judge("こんにちは。これはURLではありません");
  assert.equal(t.kind, "text");
  assert.equal(t.level, "low");
  assert.deepEqual(t.signals, []);
});

test("URL を部品に分ける: 既定のポートは消え、登録ドメインと公開接尾辞の区分が出る", () => {
  const a = C.analyze("https://Login.Example.co.jp:443/a/b?x=1#y");
  assert.deepEqual([a.url.host, a.url.port, a.url.registrable, a.url.suffix, a.url.suffixSection], ["login.example.co.jp", "", "example.co.jp", "co.jp", "icann"]);
  assert.ok(!ids(a).includes("port"));
  assert.ok(ids(C.analyze("http://example.com:8080/")).includes("port"));
  assert.ok(!ids(C.analyze("http://example.com:80/login")).includes("port"));
  // 10進・16進で書いた IP は URL が正規化する。元の書き方も残す
  const ip = C.analyze("http://0x7f000001/");
  assert.equal(ip.url.host, "127.0.0.1");
  const sig = ip.signals.find((s) => s.id === "ip-host");
  assert.equal(sig.detail.written, "0x7f000001");
  assert.equal(C.analyze("https://someone.pages.dev/").signals.find((s) => s.id === "hosting").detail.suffix, "pages.dev");
  assert.ok(!ids(C.analyze("https://pages.dev/")).includes("hosting"));
});

test("登録ドメインの形: 子音の連続・数字の混在・ハイフン（公式と日本語ドメインでは数えない）", () => {
  assert.equal(C.consonantRun("vulaqffdzh"), 6);
  assert.equal(C.consonantRun("kakaku"), 1);
  assert.equal(C.consonantRun("nikkei"), 2);
  assert.ok(ids(C.analyze("https://vulaqffdzh.top/jp/")).includes("random-label"));
  assert.ok(!ids(C.analyze("https://kakaku.com/")).includes("random-label"));
  assert.ok(ids(C.analyze("https://qfi2fewj.cn/x")).includes("digits-mixed"));
  assert.ok(ids(C.analyze("https://my-secure-pay.com/")).includes("hyphens"));
  const idn = C.analyze("https://xn--pckua2a7gp15o89zb.com/");
  assert.deepEqual(ids(idn).filter((i) => ["hyphens", "digits-mixed", "random-label"].includes(i)), []);
  assert.ok(ids(idn).includes("idn"));
});

test("ブランド名: 5文字以下は語として一致したときだけ（oricon は orico に当たらない）", () => {
  assert.ok(!ids(C.analyze("https://www.oricon.co.jp/")).some((i) => i.startsWith("brand")));
  assert.ok(ids(C.analyze("https://orico-card-login.example/")).includes("brand-in-domain"));
  assert.ok(ids(C.analyze("https://saison-point.aurvixa.com/x")).includes("brand-in-subdomain"));
  assert.ok(ids(C.analyze("https://amtruth.com/rakuten/")).includes("brand-in-path"));
  assert.ok(ids(C.analyze("https://amazon.de/")).includes("brand-other-tld"));
  assert.ok(C.withinOneEdit("paypa", "paypal") && !C.withinOneEdit("paypl", "pal"));
  assert.equal(C.unconfuse("g00g1e"), "google");
});

test("同じ種類の兆候は1回だけ数える（2つのブランドに似ていても）", () => {
  const r = judge("https://paypa1.com/");
  const look = r.signals.filter((s) => s.id === "lookalike");
  assert.ok(look.length >= 2);
  assert.equal(look.filter((s) => s.points > 0).length, 1);
});

test("model.js: 点数・境目・評価の値がそろっている", () => {
  assert.ok(M.medium >= 2 && M.high > M.medium, `${M.medium} ${M.high}`);
  for (const [id, p] of Object.entries(M.points)) assert.ok(Number.isInteger(p) && p > 0 && p <= 4, id);
  for (const [tld, p] of Object.entries(M.tldPoints)) assert.ok(!["com", "net", "org", "jp"].includes(tld) && p <= 2, tld);
  assert.deepEqual(M.evaluation.map((e) => e.id), ["jpcert", "openphish", "crux", "crux5k", "legit"]);
  for (const e of M.evaluation) assert.ok(e.n > 0 && e.medium >= e.high, e.id);
});

test("短縮 URL・URL を埋め込んだクエリ・ダウンロードの拡張子（.com の TLD とは区別）", () => {
  assert.ok(ids(C.analyze("https://bit.ly/3abcd")).includes("shortener"));
  const e = C.analyze("https://example.com/r?url=https%3A%2F%2Fevil.example%2Flogin");
  assert.equal(e.signals.find((s) => s.id === "embedded-url").detail.url, "https://evil.example/login");
  assert.ok(ids(C.analyze("https://example.com/files/setup.exe")).includes("download"));
  assert.ok(!ids(C.analyze("https://example.com")).includes("download"));
});
