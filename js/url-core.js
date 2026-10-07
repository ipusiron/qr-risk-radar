// QR Risk Radar の計算部（DOM を使わない通常のスクリプト。globalThis.QRRiskCore に置く）
// URL を部品（スキーム・ホスト・登録ドメイン・パスなど）に分け、フィッシングでよく見られる兆候を数える。
// 登録ドメイン（このURLの実際の持ち主が登録した名前）は Public Suffix List（js/psl-data.js）で決める。
// 兆候ごとの点数と、低・中・高の境目は js/model.js（学習用のデータから決めた値）にある。
(function (root) {
  "use strict";

  // ---------- Public Suffix List ----------
  let pslIndex = null;

  function pslRules() {
    if (pslIndex) return pslIndex;
    const data = root.QRPsl;
    pslIndex = new Map();
    for (const section of ["icann", "private"]) {
      for (const rule of data[section].split(" ")) {
        if (rule) pslIndex.set(rule, section);
      }
    }
    return pslIndex;
  }

  // 公開接尾辞（public suffix）と、その規則の区分（icann / private / default）。host は小文字の ASCII（Punycode）
  // 規則: 一致する規則のうち例外（!）を優先し、なければ最も長い規則。どれにも一致しなければ「*」（最後のラベル）
  function publicSuffix(host) {
    const labels = String(host).toLowerCase().replace(/\.$/, "").split(".");
    if (labels.some((l) => l === "")) return null;
    const rules = pslRules();
    // 長い候補から順に見る（最初に一致したものが最も長い規則）。例外は同じ長さのワイルドカードより優先
    for (let i = 0; i < labels.length; i++) {
      const name = labels.slice(i).join(".");
      const exc = rules.get("!" + name);
      if (exc) return { suffix: labels.slice(i + 1).join("."), section: exc };
      const exact = rules.get(name);
      if (exact) return { suffix: name, section: exact };
      const wild = i + 1 < labels.length ? rules.get("*." + labels.slice(i + 1).join(".")) : null;
      if (wild) return { suffix: name, section: wild };
    }
    return { suffix: labels[labels.length - 1], section: "default" };
  }

  // 登録ドメイン（公開接尾辞＋その左の1ラベル）。host が公開接尾辞そのものなら null
  function registrableDomain(host) {
    const h = String(host).toLowerCase().replace(/\.$/, "");
    const ps = publicSuffix(h);
    if (!ps) return null;
    const labels = h.split(".");
    const n = ps.suffix.split(".").length;
    if (labels.length <= n) return null;
    return labels.slice(-(n + 1)).join(".");
  }

  // ---------- Punycode（RFC 3492）の復号。xn-- のラベルを Unicode にして見せるため ----------
  function decodePunycodeLabel(label) {
    const base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700;
    const input = label.slice(4);
    const out = [];
    const d = input.lastIndexOf("-");
    for (let j = 0; j < Math.max(d, 0); j++) out.push(input.charCodeAt(j));
    let n = 128, i = 0, bias = 72;
    const adapt = (delta, num, first) => {
      delta = first ? Math.floor(delta / damp) : delta >> 1;
      delta += Math.floor(delta / num);
      let k = 0;
      while (delta > ((base - tMin) * tMax) >> 1) { delta = Math.floor(delta / (base - tMin)); k += base; }
      return k + Math.floor(((base - tMin + 1) * delta) / (delta + skew));
    };
    for (let p = d > 0 ? d + 1 : 0; p < input.length;) {
      const oldi = i;
      for (let w = 1, k = base; ; k += base) {
        if (p >= input.length) throw new RangeError("bad punycode");
        const c = input.charCodeAt(p++);
        const digit = c - 48 < 10 ? c - 22 : c - 65 < 26 ? c - 65 : c - 97 < 26 ? c - 97 : base;
        if (digit >= base) throw new RangeError("bad punycode");
        i += digit * w;
        const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
        if (digit < t) break;
        w *= base - t;
      }
      bias = adapt(i - oldi, out.length + 1, oldi === 0);
      n += Math.floor(i / (out.length + 1));
      i %= out.length + 1;
      out.splice(i++, 0, n);
    }
    return String.fromCodePoint(...out);
  }

  function hostToUnicode(host) {
    return String(host).split(".").map((l) => {
      if (!/^xn--/i.test(l)) return l;
      try { return decodePunycodeLabel(l.toLowerCase()); } catch (e) { return l; }
    }).join(".");
  }

  // ---------- ブランドと公式の登録ドメイン ----------
  // token: URL の中で探す名前（英小文字。5文字以下は区切り〔. - _ / 数字〕で切った語と完全に一致したときだけ。
  //   6文字以上は文字列の一部でもよい。orico が oricon に当たらないように）。
  // official: そのブランドの公式の登録ドメイン（Tranco 上位100万件で実在を確認、2026-10-07）。偽装の多い国内外のブランドに限る
  const BRANDS = [
    { name: "Google", tokens: ["google", "gmail"], official: ["google.com", "google.co.jp", "gmail.com", "youtube.com"] },
    { name: "Apple", tokens: ["apple", "appleid", "icloud", "itunes"], official: ["apple.com", "icloud.com"] },
    { name: "Amazon", tokens: ["amazon", "amzn"], official: ["amazon.com", "amazon.co.jp", "amazonaws.com", "amzn.to"] },
    { name: "PayPal", tokens: ["paypal"], official: ["paypal.com", "paypal.me"] },
    { name: "Microsoft", tokens: ["microsoft", "outlook", "office365", "onedrive", "sharepoint"],
      official: ["microsoft.com", "microsoftonline.com", "live.com", "outlook.com", "office.com", "sharepoint.com"] },
    { name: "Facebook", tokens: ["facebook"], official: ["facebook.com"] },
    { name: "Instagram", tokens: ["instagram"], official: ["instagram.com"] },
    { name: "Netflix", tokens: ["netflix"], official: ["netflix.com"] },
    { name: "えきねっと", tokens: ["ekinet", "eki-net"], official: ["eki-net.com"] },
    { name: "JR東日本", tokens: ["jreast"], official: ["jreast.co.jp"] },
    { name: "JRE POINT", tokens: ["jrepoint", "jre-point"], official: ["jrepoint.jp"] },
    { name: "ビューカード", tokens: ["viewcard"], official: ["viewcard.co.jp"] },
    { name: "三井住友（SMBC）", tokens: ["smbc", "vpass"], official: ["smbc-card.com", "vpass.ne.jp", "smbc.co.jp", "smbcnikko.co.jp"] },
    { name: "セゾン", tokens: ["saison"], official: ["saisoncard.co.jp"] },
    { name: "オリコ", tokens: ["orico"], official: ["orico.co.jp"] },
    { name: "楽天", tokens: ["rakuten"], official: ["rakuten.co.jp", "rakuten-card.co.jp", "rakuten.com", "rakuten-bank.co.jp", "rakuten-sec.co.jp"] },
    { name: "日本郵便", tokens: ["japanpost", "jppost"], official: ["japanpost.jp"] },
    { name: "第一生命", tokens: ["daiichi", "dai-ichi"], official: ["dai-ichi-life.co.jp"] },
    { name: "三菱UFJ", tokens: ["mufg"], official: ["mufg.jp", "mufgcard.com"] },
    { name: "みずほ", tokens: ["mizuho"], official: ["mizuhobank.co.jp", "mizuho-fg.co.jp", "mizuho-sc.com"] },
    { name: "イオン", tokens: ["aeon"], official: ["aeon.co.jp", "aeon.com"] },
    { name: "エポスカード", tokens: ["eposcard"], official: ["eposcard.co.jp"] },
    { name: "ドコモ", tokens: ["docomo"], official: ["docomo.ne.jp"] },
    { name: "JCB", tokens: ["jcb"], official: ["jcb.co.jp"] },
    { name: "ヤマト運輸", tokens: ["kuronekoyamato", "yamato"], official: ["kuronekoyamato.co.jp"] },
    { name: "佐川急便", tokens: ["sagawa"], official: ["sagawa-exp.co.jp"] },
    { name: "国税庁", tokens: ["e-tax", "etax"], official: ["nta.go.jp"] },
    { name: "メルカリ", tokens: ["mercari"], official: ["mercari.com"] },
    { name: "PayPay", tokens: ["paypay"], official: ["paypay.ne.jp"] },
    { name: "Yahoo! JAPAN", tokens: ["yahoo"], official: ["yahoo.co.jp", "yahoo.com"] },
  ];

  // 短縮 URL のサービス（開く前に行き先が見えない）
  const SHORTENERS = ["bit.ly", "t.co", "tinyurl.com", "is.gd", "cutt.ly", "goo.gl", "ow.ly", "buff.ly", "rebrand.ly", "t.ly",
    "x.gd", "lnkd.in", "s.id", "shorturl.at", "rb.gy", "tiny.cc", "v.gd", "qrco.de", "urx.red", "00m.in"];

  // パス・サブドメインに出ると、入力をうながす画面らしさを示す語
  const BAIT_WORDS = ["login", "signin", "sign-in", "logon", "verify", "verification", "account", "update", "secure", "security",
    "auth", "password", "wallet", "confirm", "unlock", "suspend", "billing", "payment", "card"];

  // 開くとファイルが落ちてくる拡張子（パスの末尾だけを見る。TLD の .com とは区別する）
  const DOWNLOAD_EXT = ["exe", "scr", "msi", "bat", "cmd", "com", "pif", "vbs", "js", "jse", "wsf", "hta", "ps1", "jar", "apk",
    "dmg", "pkg", "iso", "img", "zip", "rar", "7z", "lnk"];

  const DANGER_SCHEMES = ["javascript:", "vbscript:", "data:", "file:"];

  // ラベルを語に切る（. - _ と数字の境目）
  const wordsOf = (s) => String(s).toLowerCase().split(/[^a-z]+/).filter(Boolean);

  function brandHits(text, tokens) {
    const lower = String(text).toLowerCase();
    const words = wordsOf(lower);
    return tokens.some((t) => (t.length <= 5 ? words.includes(t) : lower.includes(t)));
  }

  // ラベルの中で、母音（a i u e o）を挟まずに続く子音の最長の長さ（y は子音として数える）。
  // 無作為に作った文字列（vxvbfd、pidhwdfalg）は長くなり、英語や日本語のローマ字（kakaku、nikkei）は短い
  function consonantRun(label) {
    let best = 0;
    for (const word of wordsOf(label)) {
      for (const run of word.match(/[^aeiou]+/g) || []) best = Math.max(best, run.length);
    }
    return best;
  }

  // 1文字の置き換え・挿入・削除で一致するか（編集距離が1以下）
  function withinOneEdit(a, b) {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++;
      else if (a.length < b.length) j++;
      else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }

  // 見間違えやすい数字・並びを英字に戻す（0→o、1→l、rn→m、vv→w）
  const unconfuse = (s) => s.replace(/0/g, "o").replace(/1/g, "l").replace(/rn/g, "m").replace(/vv/g, "w");

  // ---------- 入力の解析 ----------
  // 返す形: { kind: "url"|"scheme"|"text", input, url?: { scheme, host, hostUnicode, port, path, query, fragment,
  //   username, registrable, suffix, suffixSection, ip }, signals: [{ id, detail }] }
  function analyze(input) {
    const text = String(input == null ? "" : input).trim();
    const out = { kind: "text", input: text, url: null, signals: [] };
    const add = (id, detail) => out.signals.push({ id, detail: detail || {} });
    const lower = text.toLowerCase();
    const danger = DANGER_SCHEMES.find((s) => lower.startsWith(s));
    if (danger) {
      out.kind = "scheme";
      const mime = danger === "data:" ? (text.slice(5).match(/^[^;,]*/) || [""])[0].toLowerCase() : "";
      add("danger-scheme", { scheme: danger, mime });
      return out;
    }
    let url;
    try { url = new URL(text); } catch (e) { url = null; }
    if (!url || !/^https?:$/.test(url.protocol) || !url.hostname) {
      if (url && url.protocol) { out.kind = "scheme"; add("other-scheme", { scheme: url.protocol }); }
      return out;
    }
    out.kind = "url";
    const host = url.hostname.toLowerCase();
    const isIPv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
    const isIPv6 = host.startsWith("[");
    const ps = isIPv4 || isIPv6 ? null : publicSuffix(host);
    const registrable = ps ? registrableDomain(host) : null;
    const u = {
      scheme: url.protocol.slice(0, -1), host, hostUnicode: hostToUnicode(host), port: url.port, path: url.pathname,
      query: url.search, fragment: url.hash, username: url.username, registrable,
      suffix: ps ? ps.suffix : null, suffixSection: ps ? ps.section : null, ip: isIPv4 || isIPv6,
    };
    out.url = u;
    const regLabel = registrable ? registrable.slice(0, registrable.length - u.suffix.length - 1) : "";
    const subdomain = registrable ? host.slice(0, Math.max(0, host.length - registrable.length - 1)) : "";
    const tail = decodeURIComponentSafe(u.path + u.query + u.fragment);

    if (u.scheme === "http") add("http");
    if (u.ip) {
      // 元の文字列のホストと違えば、10進・16進・8進などで書いた IP を URL が正規化した
      const rawHost = (text.match(/^[a-z]+:\/\/(?:[^@/?#]*@)?([^/:?#]+)/i) || [])[1] || "";
      add("ip-host", { ip: host, written: rawHost.toLowerCase() !== host ? rawHost : "" });
    }
    if (u.username || url.password) add("userinfo", { user: decodeURIComponentSafe(u.username) });
    if (u.port) add("port", { port: u.port });
    // 利用者が自由にサブドメインを作れるサービス（PSL の PRIVATE の区分）の下のサイト。サービス自身のドメインは数えない
    if (u.suffixSection === "private" && registrable) add("hosting", { suffix: u.suffix });
    if (registrable && SHORTENERS.includes(registrable)) add("shortener", { domain: registrable });
    if (host.includes("xn--")) {
      const scripts = scriptMix(u.hostUnicode);
      add(scripts.mixed ? "idn-mixed" : "idn", { unicode: u.hostUnicode, scripts: scripts.names });
    }
    if (registrable && u.suffix) {
      const tld = u.suffix.split(".").pop();
      add("tld", { tld });
    }
    // ブランド: 公式の登録ドメインでないのに、ブランド名がサブドメイン・登録ドメイン・パスに出る／登録ドメインが似ている
    const officialBrand = registrable ? BRANDS.find((b) => b.official.includes(registrable)) : null;
    if (officialBrand) add("official", { brand: officialBrand.name, domain: registrable });
    if (registrable && !u.ip && !officialBrand) {
      for (const b of BRANDS) {
        // 公式の登録ドメインの文字列そのものを、サブドメインやパスに入れて本物に見せかける（paypal.com.example.tk、/vpass.ne.jp/）
        const fake = b.official.find((d) => (subdomain + ".").includes(d + ".") || tail.toLowerCase().includes(d));
        if (fake) add("fake-official", { brand: b.name, shown: fake, official: b.official });
        const officialLabels = b.official.map((d) => d.split(".")[0]);
        const unconfused = unconfuse(regLabel);
        if (officialLabels.includes(regLabel)) add("brand-other-tld", { brand: b.name, official: b.official });
        else if (brandHits(regLabel, b.tokens)) add("brand-in-domain", { brand: b.name, official: b.official });
        else if (officialLabels.some((o) => (o.length >= 5 && unconfused === o)
          || (o.length >= 6 && regLabel.length >= 6 && withinOneEdit(unconfused, o))))
          add("lookalike", { brand: b.name, official: b.official });
        else if (subdomain && brandHits(subdomain, b.tokens)) add("brand-in-subdomain", { brand: b.name, official: b.official });
        else if (brandHits(tail, b.tokens)) add("brand-in-path", { brand: b.name, official: b.official });
      }
    }
    if (!officialBrand && subdomain && BAIT_WORDS.some((w) => wordsOf(subdomain).includes(w) || subdomain.includes(w + "-")))
      add("bait-subdomain", { subdomain });
    if (!officialBrand && BAIT_WORDS.some((w) => wordsOf(tail).includes(w))) add("bait-path");
    if (!officialBrand && BAIT_WORDS.some((w) => wordsOf(regLabel).includes(w))) add("bait-domain", { label: regLabel });
    // 登録ドメインの形（公式の登録ドメインと、日本語などの国際化ドメイン〔xn--〕では数えない）
    const shape = !officialBrand && !regLabel.startsWith("xn--");
    if (shape && (regLabel.match(/-/g) || []).length >= 2) add("hyphens", { label: regLabel });
    if (subdomain.split(".").filter(Boolean).length >= 3) add("deep-subdomain", { subdomain });
    const letters = regLabel.replace(/[^a-z]/g, "");
    if (shape && /[a-z]\d|\d[a-z]/.test(regLabel) && letters.length >= 3) add("digits-mixed", { label: regLabel });
    const run = consonantRun(regLabel);
    if (shape && letters.length >= 6 && run >= RANDOM_RUN) add("random-label", { label: regLabel, run });
    const ext = (u.path.match(/\.([a-z0-9]{1,4})$/i) || [])[1];
    if (ext && DOWNLOAD_EXT.includes(ext.toLowerCase())) add("download", { ext: ext.toLowerCase() });
    const embedded = (u.query + u.fragment).match(/(?:^|[?&#=])(https?(?::|%3A)(?:\/|%2F){2}[^&#]+)/i);
    if (embedded) add("embedded-url", { url: decodeURIComponentSafe(embedded[1]) });
    if (/%25[0-9a-f]{2}/i.test(text)) add("double-encoding");
    if (text.length > 150) add("long", { length: text.length });
    return out;
  }

  // 無作為な文字列らしいラベルの境目（子音がこの数以上続く）
  const RANDOM_RUN = 4;

  function decodeURIComponentSafe(s) {
    try { return decodeURIComponent(s); } catch (e) { return s; }
  }

  // 表記体系の混在（ラテン文字とキリル文字・ギリシャ文字など）。ASCII の数字・ハイフン・ドットは数えない
  function scriptMix(host) {
    const names = new Set();
    for (const label of host.split(".")) {
      for (const ch of label) {
        if (/[0-9.-]/.test(ch)) continue;
        if (/\p{Script=Latin}/u.test(ch)) names.add("Latin");
        else if (/\p{Script=Cyrillic}/u.test(ch)) names.add("Cyrillic");
        else if (/\p{Script=Greek}/u.test(ch)) names.add("Greek");
        else if (/\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u.test(ch)) names.add("Japanese/Han");
        else names.add("Other");
      }
    }
    const list = [...names];
    const mixed = names.has("Latin") && (names.has("Cyrillic") || names.has("Greek"));
    return { mixed, names: list };
  }

  // ---------- 点数と危険度 ----------
  // model: { points: { 兆候のID: 点 }, tldPoints: { TLD: 点 }, medium, high }。点のない兆候は0点（情報として出す）
  function score(result, model) {
    const m = model || root.QRModel;
    // 同じ種類の兆候は1回だけ数える（2つのブランドに似ていても加算は1回）
    let total = 0;
    const seen = new Set();
    const scored = result.signals.map((s) => {
      let p = s.id === "tld" ? (m.tldPoints[s.detail.tld] || 0) : (m.points[s.id] || 0);
      if (seen.has(s.id)) p = 0;
      seen.add(s.id);
      total += p;
      return { ...s, points: p };
    });
    let level = total >= m.high ? "high" : total >= m.medium ? "medium" : "low";
    if (result.signals.some((s) => s.id === "danger-scheme")) level = "high";
    return { ...result, signals: scored, total, level };
  }


  root.QRRiskCore = {
    BRANDS, SHORTENERS, BAIT_WORDS, DOWNLOAD_EXT,
    publicSuffix, registrableDomain, decodePunycodeLabel, hostToUnicode, consonantRun, withinOneEdit, unconfuse, scriptMix,
    analyze, score, _resetPsl: () => { pslIndex = null; },
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
