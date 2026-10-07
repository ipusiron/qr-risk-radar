// QR Risk Radar の画面。判定は js/url-core.js（QRRiskCore）、点数は js/model.js（QRModel）、文言は js/messages.js（QRText）
(function () {
  "use strict";
  const C = window.QRRiskCore, M = window.QRModel, T = window.QRText, U = window.QRText.ui;
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
    const input = $("whitelistInput"), status = $("trustStatus");
    const d = normalizeDomain(input.value);
    if (!d) { status.textContent = U.trustInvalid; return; }
    if (d.error === "suffix") { status.textContent = U.trustSuffix(d.host); return; }
    if (!trusted.includes(d.host)) { trusted.push(d.host); saveTrusted(); }
    status.textContent = U.trustAdded(C.hostToUnicode(d.host));
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

  function renderResult(input, source) {
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
    if (analyzed.kind !== "text") blocks.push(el("h3", { text: U.signalsHeading }), signalList(scored, trustedHere));
    blocks.push(el("div", { class: "qr-make" },
      el("button", { type: "button", class: "btn", text: U.makeQr, onclick: (e) => makeQr(analyzed.input, e.currentTarget.parentElement) })));
    const box = $("result");
    box.replaceChildren(...blocks);
    box.hidden = false;
  }

  function hideResult() {
    const box = $("result");
    box.hidden = true;
    box.replaceChildren();
  }

  // ---------- QR コードを作る（訓練用の資料・読み取りの試験に） ----------
  function makeQr(text, holder) {
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
    $("manualStatus").textContent = "";
    renderResult(text, "manual");
    $("result").scrollIntoView({ block: "nearest" });
  }

  function renderSamples() {
    for (const [i, g] of window.QRSamples.entries()) {
      const items = g.items.map((s) => {
        const a = C.analyze(s.url);
        return el("li", {}, el("button", { type: "button", class: "sample", onclick: () => runManual(s.url) },
          el("span", { class: "sample-title" }, s.title, " ", levelBadge(displayLevel(a, C.score(a), false))),
          el("span", { class: "sample-note", text: s.note })));
      });
      $("samples").append(el("details", { class: "sample-group", open: i === 0 },
        el("summary", { text: U.sampleGroup(g.group, g.items.length) }), el("ul", {}, items)));
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

  function qrStatus(text, isError) {
    const s = $("qrStatus");
    s.textContent = text;
    s.classList.toggle("error", !!isError);
  }

  function onDecoded(text) {
    qrStatus(U.qrRead);
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
    if (!QrScanner) { qrStatus(U.qrNoLibrary, true); return; }
    if (scanner) return;
    hideResult();
    $("imageBox").hidden = true;
    $("startCameraBtn").disabled = true;
    qrStatus(U.qrPreparing);
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
      qrStatus(U.qrAim);
    } catch (e) {
      stopCamera();
      qrStatus(e && e.message === "no-camera" ? U.qrNoCamera : U.qrCameraFailed, true);
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
    if (!file) return;
    stopCamera();
    hideResult();
    const img = $("imagePreview");
    if (img.dataset.url) URL.revokeObjectURL(img.dataset.url);
    img.dataset.url = URL.createObjectURL(file);
    img.src = img.dataset.url;
    $("imageName").textContent = U.imageName(file.name, fmt(Math.max(1, Math.round(file.size / 1024))));
    $("imageBox").hidden = false;
    qrStatus(U.qrReading);
    try {
      onDecoded(await decodeFile(file));
    } catch (err) {
      qrStatus(U.qrNotFound, true);
    }
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
    renderTrusted();
    renderSamples();
    renderAccuracy();
    setupTabs();
    $("analyzeBtn").addEventListener("click", () => {
      const v = $("payload").value;
      if (!v.trim()) { $("manualStatus").textContent = U.emptyInput; hideResult(); return; }
      runManual(v);
    });
    $("payload").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) $("analyzeBtn").click(); });
    $("clearBtn").addEventListener("click", () => {
      $("payload").value = "";
      $("manualStatus").textContent = "";
      hideResult();
      $("payload").focus();
    });
    $("addWhitelistBtn").addEventListener("click", addTrusted);
    $("whitelistInput").addEventListener("keydown", (e) => { if (e.key === "Enter") addTrusted(); });
    $("startCameraBtn").addEventListener("click", startCamera);
    $("stopCameraBtn").addEventListener("click", () => { stopCamera(); qrStatus(U.qrStopped); });
    $("fileInput").addEventListener("change", onFile);
  });
})();
