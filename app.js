// QR Risk Radar の画面。判定は js/url-core.js（QRRiskCore）、点数は js/model.js（QRModel）、
// 文言は js/messages.js・js/messages-en.js（QRTexts）、言語の決定は js/i18n.js（QRI18n）
(function () {
  "use strict";
  const C = window.QRRiskCore, M = window.QRModel, I18N = window.QRI18n;
  let T = window.QRTexts.ja, U = T.ui;
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "qr-risk-radar-whitelist";

  // 要素を作る（文字は textContent で入れる。HTML として解釈させない）
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) node.append(c);
    return node;
  }
  const fmt = (n) => n.toLocaleString(U.locale);
  const missRate = (100 - M.evaluation.find((e) => e.id === "jpcert").medium).toFixed(1);

  // 状態の文（id ごとに、文言のキーと引数を持つ。言語を切り替えたら作り直す）
  const statuses = {};
  function setStatus(id, key, arg, isError) {
    statuses[id] = key ? { key, arg, isError: !!isError } : null;
    paintStatus(id);
  }
  function paintStatus(id) {
    const st = statuses[id], node = $(id);
    node.textContent = !st ? "" : typeof U[st.key] === "function" ? U[st.key](st.arg) : U[st.key];
    node.classList.toggle("error", !!(st && st.isError));
  }

  // ---------- 信頼するドメイン（登録ドメインの単位。公開接尾辞〔co.jp・pages.dev など〕は登録できない） ----------
  let trusted = [];
  function normalizeDomain(input) {
    const raw = String(input).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/[/?#].*$/, "").replace(/\.$/, "");
    if (!raw || /[\s@:]/.test(raw) || !raw.includes(".")) return null;
    let host;
    try { host = new URL("http://" + raw + "/").hostname; } catch (e) { return null; }
    if (/^\d+(\.\d+){3}$/.test(host) || host.startsWith("[")) return null;
    if (C.publicSuffix(host).suffix === host) return { error: "suffix", host };
    return { host };
  }
  function loadTrusted() {
    try {
      const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      trusted = Array.isArray(v) ? v.map(normalizeDomain).filter((d) => d && !d.error).map((d) => d.host) : [];
    } catch (e) { trusted = []; }
  }
  function saveTrusted() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trusted)); } catch (e) { /* 保存できない環境でも、開いている間は使える */ }
  }
  function isTrusted(url) {
    return !!url && !url.ip && trusted.some((d) => url.host === d || url.host.endsWith("." + d));
  }
  function renderTrusted() {
    const list = $("whitelistItems");
    list.replaceChildren();
    if (!trusted.length) { list.append(el("li", { class: "empty", text: U.trustEmpty })); return; }
    for (const d of trusted) {
      const remove = () => { trusted = trusted.filter((x) => x !== d); saveTrusted(); renderTrusted(); };
      list.append(el("li", {}, el("span", { text: C.hostToUnicode(d) }),
        el("button", { type: "button", class: "btn small", "aria-label": U.trustRemoveLabel(d), text: U.trustRemove, onclick: remove })));
    }
  }
  function addTrusted() {
    const input = $("whitelistInput");
    const d = normalizeDomain(input.value);
    if (!d) { setStatus("trustStatus", "trustInvalid"); return; }
    if (d.error === "suffix") { setStatus("trustStatus", "trustSuffix", d.host); return; }
    if (!trusted.includes(d.host)) { trusted.push(d.host); saveTrusted(); }
    setStatus("trustStatus", "trustAdded", C.hostToUnicode(d.host));
    input.value = "";
    renderTrusted();
  }

  // ---------- 判定の表示 ----------
  // 画面に出す段階: high・medium・low（URL と危険なスキーム）／trusted（信頼済み）／other（tel: や WIFI: など）／text（URL でない文字）
  function displayLevel(analyzed, scored, trustedHere) {
    if (analyzed.kind === "text") return "text";
    if (analyzed.kind === "scheme" && scored.level !== "high") return "other";
    return trustedHere ? "trusted" : scored.level;
  }

  function levelBadge(level) {
    return el("span", { class: `badge level-${level}`, text: T.level[level] });
  }

  // ホストを「サブドメイン（薄く）＋登録ドメイン（太字・下線）」に分けて見せる
  function hostView(url) {
    if (url.ip || !url.registrable) return el("span", { class: "host-reg", text: url.hostUnicode });
    const reg = C.hostToUnicode(url.registrable);
    const sub = url.hostUnicode.slice(0, url.hostUnicode.length - reg.length);
    return el("span", { class: "host" }, sub ? el("span", { class: "host-sub", text: sub }) : null, el("span", { class: "host-reg", text: reg }));
  }

  function partsTable(url) {
    const rows = [];
    const add = (key, value, extra) => {
      if (value) rows.push(el("tr", {}, el("th", { scope: "row", text: T.parts[key] }), el("td", {}, el("code", { text: value }), extra || null)));
    };
    add("scheme", url.scheme);
    add("username", url.username);
    add("host", url.host);
    if (url.hostUnicode !== url.host) add("hostUnicode", url.hostUnicode);
    if (url.registrable) {
      add("registrable", url.registrable);
      add("suffix", url.suffix, el("span", { class: "muted", text: ` ${T.suffixSection[url.suffixSection] || ""}` }));
      add("subdomain", url.host.slice(0, Math.max(0, url.host.length - url.registrable.length - 1)));
    }
    add("port", url.port);
    add("path", url.path !== "/" ? url.path : "");
    add("query", url.query);
    add("fragment", url.fragment);
    return el("table", { class: "parts" }, el("caption", { class: "visually-hidden", text: U.partsCaption }), el("tbody", {}, rows));
  }

  // 兆候の中に別の URL があれば、それも調べられるようにする
  function followUrl(signal) {
    if (signal.id === "embedded-url") return signal.detail.url;
    if (signal.id === "base64" && /^https?:\/\//i.test(signal.detail.decoded)) return signal.detail.decoded;
    return null;
  }

  function signalList(result, trustedHere) {
    const shown = result.signals.filter((s) => !(s.id === "tld" && !s.points));
    if (!shown.length) return el("p", { class: "muted", text: U.noSignals });
    return el("ul", { class: "signals" }, shown.map((s) => {
      const danger = s.id === "danger-scheme";
      const text = T.signals[s.id](s.detail, s.points);
      const pts = danger ? U.ptsDanger : trustedHere ? U.ptsTrusted : s.points > 0 ? `+${s.points}` : "0";
      const next = followUrl(s);
      return el("li", { class: s.points > 0 || danger ? "hit" : "info" },
        el("span", { class: "pts", "aria-label": danger ? U.ptsDangerLabel : U.ptsLabel(s.points), text: pts }),
        el("span", { class: "signal-text" }, text,
          next ? el("button", { type: "button", class: "btn small follow", text: U.follow, onclick: () => runManual(next) }) : null));
    }));
  }

  // QR コードの中身の種類（Wi-Fi・電話・SMS・連絡先など）を項目の表・注意・中の URL にして見せる
  function payloadView(p) {
    const P = T.payload;
    const box = el("section", { class: "payload" }, el("h3", { text: `${P.heading}: ${P.types[p.type]}` }));
    if (p.fields.length) {
      const rows = p.fields.map((f) => el("tr", {}, el("th", { scope: "row", text: P.fields[f.key] }),
        el("td", {}, f.secret ? secretView(f.value) : el("code", { text: P.value(f.key, f.value) }))));
      box.append(el("table", { class: "parts" }, el("tbody", {}, rows)));
    }
    if (p.notes.length) box.append(el("ul", { class: "notes" }, p.notes.map((n) => el("li", { text: P.notes[n] }))));
    if (p.urls.length) {
      box.append(el("h4", { text: P.urlsHeading }), el("ul", { class: "payload-urls" }, p.urls.map((u) => {
        const a = C.analyze(u);
        const level = displayLevel(a, C.score(a), a.kind === "url" && isTrusted(a.url));
        return el("li", {}, levelBadge(level), " ", el("code", { text: u }),
          el("button", { type: "button", class: "btn small follow", text: U.follow, onclick: () => runManual(u) }));
      })));
    }
    return box;
  }

  // パスワード・秘密鍵は伏せて出し、ボタンで見せる
  function secretView(value) {
    const P = T.payload, n = [...value].length;
    const code = el("code", { text: P.mask(n) });
    const btn = el("button", { type: "button", class: "btn small", "aria-pressed": "false", text: P.reveal });
    btn.addEventListener("click", () => {
      const on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(on));
      code.textContent = on ? value : P.mask(n);
      btn.textContent = on ? P.hide : P.reveal;
    });
    return [code, " ", btn];
  }

  let last = null, qrMadeFor = null;
  function renderResult(input, source) {
    last = { input, source };
    qrMadeFor = null;
    const analyzed = C.analyze(input);
    const scored = C.score(analyzed);
    const trustedHere = analyzed.kind === "url" && isTrusted(analyzed.url);
    const level = displayLevel(analyzed, scored, trustedHere);

    const head = el("div", { class: "result-head" }, el("h2", { text: U.heading[source] }), levelBadge(level));
    if (analyzed.kind === "url" && !trustedHere) head.append(el("span", { class: "total", text: U.total(scored.total, M.medium, M.high) }));
    const note = analyzed.kind === "scheme" && level === "high" ? T.levelNote.danger
      : level === "low" ? T.levelNote.low(missRate) : T.levelNote[level];

    const blocks = [head, el("p", { class: "level-note", text: note }),
      el("div", { class: "input-echo" }, el("span", { class: "muted", text: U.content }), el("code", { text: analyzed.input }))];
    if (analyzed.kind === "url") {
      const u = analyzed.url;
      blocks.push(el("p", { class: "owner" }, el("span", { class: "muted", text: u.ip ? U.ownerIp : U.owner }),
        el("strong", { text: u.ip ? u.host : C.hostToUnicode(u.registrable || u.host) })));
      blocks.push(el("p", { class: "host-line" }, hostView(u)));
      blocks.push(el("details", { class: "parts-box" }, el("summary", { text: U.partsSummary }), partsTable(u)));
    }
    const payload = window.QRPayload.parse(analyzed.input);
    if (payload) blocks.push(payloadView(payload));
    // URL 以外の中身（other）は、種類を読み解けたら兆候の欄（スキームの説明だけ）を出さない
    if (analyzed.kind !== "text" && !(level === "other" && payload)) blocks.push(el("h3", { text: U.signalsHeading }), signalList(scored, trustedHere));
    blocks.push(el("div", { class: "qr-make" },
      el("button", { type: "button", class: "btn", text: U.makeQr, onclick: (e) => makeQr(analyzed.input, e.currentTarget.parentElement) })));
    const box = $("result");
    box.replaceChildren(...blocks);
    box.hidden = false;
  }

  function hideResult() {
    last = null;
    const box = $("result");
    box.hidden = true;
    box.replaceChildren();
  }

  // ---------- QR コードを作る（訓練用の資料・読み取りの試験に） ----------
  function makeQr(text, holder) {
    qrMadeFor = text;
    const old = holder.querySelector(".qr-out");
    if (old) old.remove();
    const out = el("div", { class: "qr-out" });
    try {
      window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs["UTF-8"];
      const qr = window.qrcode(0, "M");
      qr.addData(text, "Byte");
      qr.make();
      const n = qr.getModuleCount(), cell = 8, margin = 4, size = (n + margin * 2) * cell;
      const canvas = el("canvas", { width: size, height: size });
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#000";
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
      }
      const png = canvas.toDataURL("image/png");
      out.append(el("img", { src: png, alt: U.qrAlt, width: 200, height: 200 }),
        el("a", { class: "btn small", href: png, download: "qr-risk-radar.png", text: U.qrSave }),
        el("p", { class: "hint", text: U.qrHint }));
    } catch (e) {
      out.append(el("p", { class: "status error", text: U.qrTooLong }));
    }
    holder.append(out);
  }

  // ---------- 入力欄・サンプル ----------
  function runManual(text) {
    selectTab("manual");
    $("payload").value = text;
    setStatus("manualStatus", null);
    renderResult(text, "manual");
    $("result").scrollIntoView({ block: "nearest" });
  }

  function renderSamples() {
    const en = I18N.getLanguage() === "en";
    const open = [...$("samples").querySelectorAll("details")].map((d) => d.open);
    $("samples").replaceChildren();
    for (const [i, g] of window.QRSamples.entries()) {
      const items = g.items.map((s) => {
        const a = C.analyze(s.url);
        return el("li", {}, el("button", { type: "button", class: "sample", onclick: () => runManual(s.url) },
          el("span", { class: "sample-title" }, en ? s.titleEn : s.title, " ", levelBadge(displayLevel(a, C.score(a), false))),
          el("span", { class: "sample-note", text: en ? s.noteEn : s.note })));
      });
      $("samples").append(el("details", { class: "sample-group", open: open.length ? open[i] : i === 0 },
        el("summary", { text: U.sampleGroup(en ? g.groupEn : g.group, g.items.length) }), el("ul", {}, items)));
    }
  }

  // ---------- 言語（日本語・英語） ----------
  function setLanguage(lang, persist) {
    T = I18N.use(lang, document);
    U = T.ui;
    if (persist) I18N.save(lang);
    renderSamples();
    renderAccuracy();
    renderTrusted();
    for (const id of Object.keys(statuses)) paintStatus(id);
    paintImageName();
    if (last) {
      const keepQr = qrMadeFor === last.input;
      renderResult(last.input, last.source);
      if (keepQr) makeQr(last.input, $("result").querySelector(".qr-make"));
    }
  }

  // ---------- タブ（矢印キーで移動。WAI-ARIA Authoring Practices のタブの形） ----------
  const tabs = () => [$("tab-manual"), $("tab-qr")];
  function selectTab(name) {
    for (const t of tabs()) {
      const on = t.id === "tab-" + name;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !on;
    }
    if (name !== "qr") stopCamera();
  }
  function setupTabs() {
    for (const t of tabs()) {
      t.addEventListener("click", () => {
        if (t.getAttribute("aria-selected") === "true") return;
        hideResult();
        selectTab(t.id.slice(4));
      });
      t.addEventListener("keydown", (e) => {
        const list = tabs(), i = list.indexOf(t);
        const j = e.key === "ArrowRight" ? (i + 1) % list.length : e.key === "ArrowLeft" ? (i + list.length - 1) % list.length
          : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : -1;
        if (j < 0) return;
        e.preventDefault();
        hideResult();
        selectTab(list[j].id.slice(4));
        list[j].focus();
      });
    }
  }

  // ---------- QR コードを読む ----------
  let scanner = null;
  const QrScanner = window.QrScanner;
  // qr-scanner は、ブラウザーに QR 用の BarcodeDetector がなければデコーダーを import() で読む。Chromium・Edge は file:// で
  // 開いたページの import() を拒むので、同じ中身を通常のスクリプトにした js/qr-worker.js からワーカーを作る
  if (QrScanner && window.QRWorker) {
    const original = QrScanner.createQrEngine.bind(QrScanner);
    QrScanner.createQrEngine = async () => {
      const native = "BarcodeDetector" in window && window.BarcodeDetector.getSupportedFormats
        && (await window.BarcodeDetector.getSupportedFormats()).includes("qr_code");
      return native ? original() : window.QRWorker.createWorker();
    };
  }

  const qrStatus = (key, isError) => setStatus("qrStatus", key, null, isError);

  function onDecoded(text) {
    qrStatus("qrRead");
    renderResult(text, "qr");
  }

  // qr-scanner の枠は自前の要素で描く（ライブラリーの既定の枠は style 属性を使い、CSP の style-src 'self' で崩れるため）
  function scanOverlay() {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "scan-frame");
    svg.setAttribute("viewBox", "0 0 238 238");
    svg.setAttribute("preserveAspectRatio", "none");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M31 2H10a8 8 0 0 0-8 8v21M207 2h21a8 8 0 0 1 8 8v21m0 176v21a8 8 0 0 1-8 8h-21m-176 0H10a8 8 0 0 1-8-8v-21");
    svg.append(path);
    const div = el("div", { class: "scan-overlay" });
    div.append(svg);
    $("cameraBox").append(div);
    return div;
  }

  async function startCamera() {
    if (!QrScanner) { qrStatus("qrNoLibrary", true); return; }
    if (scanner) return;
    hideResult();
    $("imageBox").hidden = true;
    $("startCameraBtn").disabled = true;
    qrStatus("qrPreparing");
    try {
      if (!(await QrScanner.hasCamera())) throw new Error("no-camera");
      $("cameraBox").hidden = false;
      const old = $("cameraBox").querySelector(".scan-overlay");
      if (old) old.remove();
      scanner = new QrScanner($("preview"), (r) => { const text = r.data; stopCamera(); onDecoded(text); }, {
        returnDetailedScanResult: true, preferredCamera: "environment", highlightScanRegion: true, highlightCodeOutline: false,
        overlay: scanOverlay(), maxScansPerSecond: 10,
      });
      await scanner.start();
      $("stopCameraBtn").disabled = false;
      qrStatus("qrAim");
    } catch (e) {
      stopCamera();
      qrStatus(e && e.message === "no-camera" ? "qrNoCamera" : "qrCameraFailed", true);
    }
  }

  function stopCamera() {
    if (scanner) { scanner.stop(); scanner.destroy(); scanner = null; }
    $("cameraBox").hidden = true;
    $("startCameraBtn").disabled = false;
    $("stopCameraBtn").disabled = true;
  }

  // 画像から読む: qr-scanner（BarcodeDetector かワーカー）→ だめならブラウザーの BarcodeDetector を直接
  async function decodeFile(file) {
    if (QrScanner) {
      try {
        const r = await QrScanner.scanImage(file, { returnDetailedScanResult: true, alsoTryWithoutScanRegion: true });
        return r.data;
      } catch (e) {
        if (!("BarcodeDetector" in window)) throw e;
      }
    }
    if ("BarcodeDetector" in window) {
      const bitmap = await createImageBitmap(file);
      try {
        const found = await new window.BarcodeDetector({ formats: ["qr_code"] }).detect(bitmap);
        if (found.length) return found[0].rawValue;
      } finally { bitmap.close(); }
    }
    throw new Error("not-found");
  }

  async function onFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (file) decodeImageFile(file);
  }

  // 画像を読む（ファイルの選択・貼り付け・ドロップの共通）。続けて読ませたときは、最後の画像の結果だけを出す
  let decodeSeq = 0, lastImage = null;
  function paintImageName() {
    $("imageName").textContent = lastImage ? U.imageName(lastImage.name, fmt(Math.max(1, Math.round(lastImage.size / 1024)))) : "";
  }
  async function decodeImageFile(file) {
    const seq = ++decodeSeq;
    selectTab("qr");
    stopCamera();
    hideResult();
    const img = $("imagePreview");
    if (img.dataset.url) URL.revokeObjectURL(img.dataset.url);
    img.dataset.url = URL.createObjectURL(file);
    img.src = img.dataset.url;
    lastImage = { name: file.name, size: file.size };
    paintImageName();
    $("imageBox").hidden = false;
    qrStatus("qrReading");
    try {
      const text = await decodeFile(file);
      if (seq === decodeSeq) onDecoded(text);
    } catch (err) {
      if (seq === decodeSeq) qrStatus("qrNotFound", true);
    }
  }

  // ---------- 貼り付けとドロップ ----------
  // 画像なら QR コードとして読み、文字（リンクのドロップ・入力欄の外での貼り付け）なら判定する
  const imageOf = (dt) => {
    const files = [...(dt.files || [])];
    for (const item of dt.items || []) if (item.kind === "file") files.push(item.getAsFile());
    return files.find((f) => f && /^image\//.test(f.type)) || null;
  };
  const isEditable = (node) => !!node && (node.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName));
  function setupPasteAndDrop() {
    document.addEventListener("paste", (e) => {
      const dt = e.clipboardData;
      if (!dt) return;
      const image = imageOf(dt);
      if (image) { e.preventDefault(); decodeImageFile(image); return; }
      const text = dt.getData("text/plain");
      if (!isEditable(document.activeElement) && text.trim()) { e.preventDefault(); runManual(text.trim()); }
    });
    document.addEventListener("dragover", (e) => {
      if (!e.dataTransfer) return;
      e.preventDefault();
      document.body.classList.add("dragging");
    });
    document.addEventListener("dragleave", (e) => { if (!e.relatedTarget) document.body.classList.remove("dragging"); });
    document.addEventListener("drop", (e) => {
      document.body.classList.remove("dragging");
      const dt = e.dataTransfer;
      if (!dt) return;
      e.preventDefault();
      const image = imageOf(dt);
      if (image) { decodeImageFile(image); return; }
      const uri = (dt.getData("text/uri-list") || "").split(/\r?\n/).find((l) => l.trim() && !l.startsWith("#"));
      const text = (uri || dt.getData("text/plain") || "").trim();
      if (text) runManual(text);
    });
  }

  // ---------- 判定の確かさ（js/model.js の evaluation を、見抜けた割合と誤って疑った割合の2つの表にする） ----------
  function renderAccuracy() {
    $("accuracyLead").textContent = U.accuracyLead(fmt(M.training.phishing), fmt(M.training.benign));
    for (const [id, kind] of [["accuracyPhish", "phish"], ["accuracyBenign", "benign"]]) {
      const rows = M.evaluation.filter((e) => T.evaluation[e.id].kind === kind).map((e) =>
        el("tr", {}, el("th", { scope: "row", text: T.evaluation[e.id].name }), el("td", { text: fmt(e.n) }),
          el("td", { text: `${e.medium.toFixed(1)}%` }), el("td", { text: `${e.high.toFixed(1)}%` })));
      $(id).replaceChildren(
        el("thead", {}, el("tr", {}, U.accuracyHead.map((h) => el("th", { scope: "col", text: h })))),
        el("tbody", {}, rows));
    }
  }

  // ---------- 起動 ----------
  document.addEventListener("DOMContentLoaded", () => {
    loadTrusted();
    setLanguage(I18N.initialLanguage(location.search, I18N.readSaved(), navigator.languages || [navigator.language]), false);
    setupTabs();
    setupPasteAndDrop();
    $("analyzeBtn").addEventListener("click", () => {
      const v = $("payload").value;
      if (!v.trim()) { setStatus("manualStatus", "emptyInput"); hideResult(); return; }
      runManual(v);
    });
    $("payload").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) $("analyzeBtn").click(); });
    $("clearBtn").addEventListener("click", () => {
      $("payload").value = "";
      setStatus("manualStatus", null);
      hideResult();
      $("payload").focus();
    });
    $("addWhitelistBtn").addEventListener("click", addTrusted);
    $("whitelistInput").addEventListener("keydown", (e) => { if (e.key === "Enter") addTrusted(); });
    $("startCameraBtn").addEventListener("click", startCamera);
    $("stopCameraBtn").addEventListener("click", () => { stopCamera(); qrStatus("qrStopped"); });
    $("fileInput").addEventListener("change", onFile);
    $("langBtn").addEventListener("click", () => setLanguage(I18N.getLanguage() === "ja" ? "en" : "ja", true));
  });
})();
