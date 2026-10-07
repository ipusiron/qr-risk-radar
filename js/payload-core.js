// QR コードの中身の種類を読み解く（DOM に依存しない計算部）。URL 以外の中身（Wi-Fi の設定・電話・SMS・メール・連絡先・
// 位置・2段階認証の鍵・暗号資産の送金先・予定・アプリの起動）を項目に分け、注意点と、中に含まれる URL を取り出す
// 返す形: null（URL だけ・読み解く種類がない）| { type, fields: [{ key, value, secret? }], notes: [id], urls: [url] }
(function (root) {
  "use strict";

  // \ でエスケープした文字を残しながら、sep で区切る（ZXing の WIFI:・MECARD:・MATMSG: の書き方。\; \, \: \\ \" を許す）
  function splitEscaped(s, sep) {
    const parts = [];
    let cur = "";
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === "\\" && i + 1 < s.length) { cur += s[++i]; continue; }
      if (ch === sep) { parts.push(cur); cur = ""; continue; }
      cur += ch;
    }
    parts.push(cur);
    return parts;
  }

  // "KEY:value;KEY:value;;" を { KEY: [value, …] } にする（キーは大文字）
  function keyValues(body) {
    const out = {};
    for (const part of splitEscaped(body, ";")) {
      const i = part.indexOf(":");
      if (i <= 0) continue;
      const key = part.slice(0, i).trim().toUpperCase();
      (out[key] = out[key] || []).push(part.slice(i + 1));
    }
    return out;
  }

  // % の書き方を戻す。form＝true はクエリの値（+ を空白に）。電話番号・宛先の + は残す
  const decode = (s, form) => {
    try { return decodeURIComponent(form ? String(s).replace(/\+/g, " ") : String(s)); } catch (e) { return String(s); }
  };
  const first = (kv, k) => (kv[k] && kv[k][0] !== undefined ? kv[k][0] : "");

  // 文の中の http・https の URL（末尾の句読点・閉じ括弧は外す）
  function extractUrls(text) {
    const found = String(text).match(/https?:\/\/[^\s<>"'「」（）]+/gi) || [];
    return [...new Set(found.map((u) => u.replace(/[)\].,;:!?、。」』]+$/, "")))];
  }

  // 電話番号の注意（数字と + だけにして見る）
  function phoneNotes(number) {
    const n = String(number).replace(/[^\d+]/g, "");
    const notes = [];
    if (/^(?:\+81|0)(?:570|180)/.test(n)) notes.push("tel-paid");
    if (n.startsWith("+") && !n.startsWith("+81")) notes.push("tel-intl");
    return notes;
  }

  function wifi(text) {
    const kv = keyValues(text.slice(5));
    const t = first(kv, "T").trim();
    const pass = first(kv, "P");
    const fields = [{ key: "ssid", value: first(kv, "S") }, { key: "security", value: t || "nopass" }];
    if (pass) fields.push({ key: "password", value: pass, secret: true });
    const hidden = /^true$/i.test(first(kv, "H").trim());
    if (hidden) fields.push({ key: "hidden", value: "true" });
    const notes = [];
    if (!t || /^nopass$/i.test(t)) notes.push("wifi-open");
    if (/^WEP$/i.test(t)) notes.push("wifi-wep");
    if (hidden) notes.push("wifi-hidden");
    notes.push("wifi-check");
    return { type: "wifi", fields, notes, urls: [] };
  }

  function tel(text) {
    const number = decode(text.slice(4));
    return { type: "tel", fields: [{ key: "number", value: number }], notes: [...phoneNotes(number), "tel-check"], urls: [] };
  }

  function sms(text) {
    let number = "", body = "";
    const m = text.match(/^smsto:([^:]*):?([\s\S]*)$/i);
    if (m) { number = m[1]; body = m[2]; } else {
      const rest = text.slice(4);
      const q = rest.indexOf("?");
      number = (q >= 0 ? rest.slice(0, q) : rest).replace(/;$/, "");
      if (q >= 0) body = new URLSearchParams(rest.slice(q + 1)).get("body") || "";
      number = decode(number);
    }
    const fields = [{ key: "number", value: number }];
    if (body) fields.push({ key: "body", value: body });
    return { type: "sms", fields, notes: [...phoneNotes(number), "sms-check"], urls: extractUrls(body) };
  }

  function mail(text) {
    let to = "", subject = "", body = "";
    if (/^matmsg:/i.test(text)) {
      const kv = keyValues(text.slice(7));
      to = first(kv, "TO"); subject = first(kv, "SUB"); body = first(kv, "BODY");
    } else {
      const rest = text.slice(7);
      const q = rest.indexOf("?");
      to = decode(q >= 0 ? rest.slice(0, q) : rest);
      if (q >= 0) {
        const p = new URLSearchParams(rest.slice(q + 1));
        subject = p.get("subject") || ""; body = p.get("body") || "";
      }
    }
    const fields = [{ key: "to", value: to }];
    if (subject) fields.push({ key: "subject", value: subject });
    if (body) fields.push({ key: "body", value: body });
    return { type: "mail", fields, notes: ["mail-check"], urls: extractUrls(subject + " " + body) };
  }

  // vCard（RFC 6350。行の折り返しを戻し、KEY;パラメーター:値 を読む）と MECARD
  function contact(text) {
    const fields = [];
    const add = (key, value) => { if (value && value.trim()) fields.push({ key, value: value.trim() }); };
    if (/^mecard:/i.test(text)) {
      const kv = keyValues(text.slice(7));
      add("name", first(kv, "N").split(",").reverse().join(" ").trim());
      for (const v of kv.TEL || []) add("tel", v);
      for (const v of kv.EMAIL || []) add("email", v);
      for (const v of kv.URL || []) add("url", v);
      add("address", first(kv, "ADR"));
      add("note", first(kv, "NOTE"));
    } else {
      const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
      const map = { FN: "name", ORG: "org", TEL: "tel", EMAIL: "email", URL: "url", ADR: "address", NOTE: "note", TITLE: "title" };
      for (const line of lines) {
        const i = line.indexOf(":");
        if (i <= 0) continue;
        const key = line.slice(0, i).split(";")[0].toUpperCase();
        let value = line.slice(i + 1).replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1");
        if (key === "ADR" || key === "ORG") value = value.split(";").filter((x) => x.trim()).join(" ");
        if (map[key]) add(map[key], value);
      }
    }
    const urls = extractUrls(fields.filter((f) => f.key === "url" || f.key === "note").map((f) => f.value).join(" "));
    const notes = urls.length ? ["contact-urls"] : [];
    for (const f of fields) if (f.key === "tel") notes.push(...phoneNotes(f.value));
    return { type: "contact", fields, notes: [...new Set(notes)], urls };
  }

  function geo(text) {
    const m = text.match(/^geo:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/i);
    if (!m) return null;
    const fields = [{ key: "lat", value: m[1] }, { key: "lon", value: m[2] }];
    const q = text.match(/[?&]q=([^&]+)/i);
    if (q) fields.push({ key: "label", value: decode(q[1], true) });
    return { type: "geo", fields, notes: ["geo-check"], urls: [] };
  }

  // 2段階認証の鍵（Google Authenticator の Key Uri Format）
  function otp(text) {
    let url;
    try { url = new URL(text); } catch (e) { return null; }
    const label = decode(url.pathname.replace(/^\/+/, ""));
    const [labelIssuer, account] = label.includes(":") ? label.split(/:(.*)/s) : ["", label];
    const p = url.searchParams;
    const fields = [{ key: "otpType", value: url.hostname || url.pathname.split("/")[0] }];
    const issuer = p.get("issuer") || labelIssuer;
    if (issuer) fields.push({ key: "issuer", value: issuer });
    if (account) fields.push({ key: "account", value: account.trim() });
    if (p.get("secret")) fields.push({ key: "secret", value: p.get("secret"), secret: true });
    for (const k of ["algorithm", "digits", "period"]) if (p.get(k)) fields.push({ key: k, value: p.get(k) });
    return { type: "otp", fields, notes: ["otp-secret"], urls: [] };
  }

  // 暗号資産の送金先（BIP 21 と同じ形の URI）
  function cryptoUri(text) {
    const m = text.match(/^(bitcoin|ethereum|litecoin|bitcoincash|dogecoin|monero):([^?]*)(\?.*)?$/i);
    if (!m) return null;
    const p = new URLSearchParams(m[3] ? m[3].slice(1) : "");
    const fields = [{ key: "currency", value: m[1].toLowerCase() }, { key: "address", value: m[2] }];
    // 送る量は amount（BIP 21）か value（EIP-681）
    for (const [k, key] of [["amount", "amount"], ["value", "amount"], ["label", "label"], ["message", "message"]]) {
      if (p.get(k)) fields.push({ key, value: p.get(k) });
    }
    return { type: "crypto", fields, notes: ["crypto-irreversible"], urls: extractUrls(p.get("message") || "") };
  }

  // 予定（iCalendar の VEVENT）
  function event(text) {
    const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
    const map = { SUMMARY: "summary", DTSTART: "start", DTEND: "end", LOCATION: "location", URL: "url", DESCRIPTION: "description" };
    const fields = [];
    let inEvent = false;
    for (const line of lines) {
      if (/^BEGIN:VEVENT/i.test(line)) inEvent = true;
      if (!inEvent) continue;
      const i = line.indexOf(":");
      if (i <= 0) continue;
      const key = line.slice(0, i).split(";")[0].toUpperCase();
      if (map[key]) fields.push({ key: map[key], value: line.slice(i + 1).replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1") });
    }
    const urls = extractUrls(fields.filter((f) => f.key === "url" || f.key === "description").map((f) => f.value).join(" "));
    return { type: "event", fields, notes: urls.length ? ["event-urls"] : [], urls };
  }

  // アプリを開く中身（Android の market:・intent:、iOS の itms-apps:）
  function app(text) {
    const fields = [];
    const urls = [];
    if (/^market:/i.test(text)) {
      const id = (text.match(/[?&]id=([^&]+)/) || [])[1];
      if (id) fields.push({ key: "package", value: decode(id, true) });
    } else if (/^intent:/i.test(text)) {
      const pkg = (text.match(/;package=([^;]+)/) || [])[1];
      const scheme = (text.match(/;scheme=([^;]+)/) || [])[1];
      const fallback = (text.match(/;S\.browser_fallback_url=([^;]+)/) || [])[1];
      if (pkg) fields.push({ key: "package", value: pkg });
      if (scheme) fields.push({ key: "scheme", value: scheme });
      if (fallback) { fields.push({ key: "fallback", value: decode(fallback) }); urls.push(...extractUrls(decode(fallback))); }
    } else {
      const id = (text.match(/\/id(\d+)/) || [])[1];
      if (id) fields.push({ key: "appId", value: id });
    }
    return { type: "app", fields, notes: ["app-open"], urls };
  }

  function parse(input) {
    const text = String(input == null ? "" : input).trim();
    if (!text) return null;
    const head = text.slice(0, 16).toLowerCase();
    if (head.startsWith("wifi:")) return wifi(text);
    if (head.startsWith("tel:")) return tel(text);
    if (head.startsWith("sms:") || head.startsWith("smsto:")) return sms(text);
    if (head.startsWith("mailto:") || head.startsWith("matmsg:")) return mail(text);
    if (head.startsWith("begin:vcard") || head.startsWith("mecard:")) return contact(text);
    if (head.startsWith("geo:")) return geo(text);
    if (head.startsWith("otpauth://")) return otp(text);
    if (/^(bitcoin|ethereum|litecoin|bitcoincash|dogecoin|monero):/.test(head)) return cryptoUri(text);
    if (head.startsWith("begin:vcalendar") || head.startsWith("begin:vevent")) return event(text);
    if (/^(market|intent|itms-apps|itms-appss):/.test(head)) return app(text);
    // javascript:・data: などの中の URL（スクリプトが開こうとする行き先）
    if (/^(javascript|vbscript|data):/.test(head)) {
      const found = extractUrls(text);
      return found.length ? { type: "script", fields: [], notes: ["script-urls"], urls: found } : null;
    }
    // http・https の URL そのものは url-core が見る。それ以外の文に URL が含まれていれば取り出す
    if (/^https?:\/\//i.test(text) && !/\s/.test(text)) return null;
    const urls = extractUrls(text);
    return urls.length ? { type: "text", fields: [], notes: ["text-urls"], urls } : null;
  }

  root.QRPayload = { parse, splitEscaped, keyValues, extractUrls, phoneNotes };
})(typeof globalThis !== "undefined" ? globalThis : this);
