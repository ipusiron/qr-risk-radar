// UI text (English). Same keys as js/messages.js (Japanese); test/i18n.test.js checks that the keys match.
// Signal explanations take the signal detail (and points) and return one sentence. Brand names use detail.brandEn.
(function (root) {
  "use strict";
  const list = (a) => (a || []).join(", ");
  const official = (d) => (d.official && d.official.length ? ` (official: ${list(d.official)})` : "");
  const brand = (d) => d.brandEn || d.brand;
  const scriptName = (s) => ({ Cyrillic: "Cyrillic", Greek: "Greek", "Japanese/Han": "Japanese characters", Other: "other characters" }[s] || s);

  const signals = {
    "danger-scheme": (d) => `Starts with ${d.scheme}. Opening it runs a script on the spot or opens files on the device`
      + `${d.mime ? ` (content type: ${d.mime})` : ""}. Always rated High regardless of points`,
    "other-scheme": (d) => `A scheme other than http/https (${d.scheme}). It opens a phone call, mail, SMS, Wi-Fi settings, etc. `
      + "Check the content before opening it",
    "http": () => "Unencrypted http. The page can be altered on the way. Be especially careful with pages that ask for input",
    "ip-host": (d) => `An IP address instead of a domain name (${d.ip})`
      + (d.written ? `. The URL wrote it as "${d.written}" (decimal or hex notation that makes the IP address hard to read)` : ""),
    "userinfo": (d) => `"${d.user}" before the @ is decoration; the real destination is the host after the @. `
      + "A trick that puts a genuine name before the @",
    "port": (d) => `Non-default port number (:${d.port})`,
    "hosting": (d) => `${d.suffix} is a service where anyone can create subdomains. `
      + "The owner is whoever created the subdomain, not the service company",
    "shortener": (d) => `Shortened URL (${d.domain}). The real destination stays hidden until you open it. `
      + "Shorteners are also used legitimately, so this alone does not make it Medium",
    "idn": (d) => `Internationalized domain name (shown as ${d.unicode}). There are many legitimate uses, such as Japanese domain names`,
    "idn-mixed": (d) => `A domain mixing Latin letters with ${list(d.scripts.filter((s) => s !== "Latin").map(scriptName))} `
      + `(shown as ${d.unicode}). A trick that imitates Latin letters with look-alikes such as the Cyrillic "а" (homograph)`,
    "tld": (d, points) => `The TLD is .${d.tld}`
      + (points > 0 ? ". It appeared more often in the training phishing URLs than in sites frequently visited in Japan" : ""),
    "official": (d) => `An official registrable domain of ${brand(d)} (according to this tool's list). `
      + "Tampered pages and abuse of the official site's redirects cannot be detected",
    "fake-official": (d) => `The string of ${brand(d)}'s official domain "${d.shown}" appears in the subdomain or path. `
      + `The owner is determined by the registrable domain, so this is not ${brand(d)}'s site${official(d)}`,
    "brand-other-tld": (d) => `Same name as ${brand(d)}'s official domain, but a different TLD${official(d)}`,
    "brand-in-domain": (d) => `The registrable domain contains ${brand(d)}'s name but is not an official domain${official(d)}`,
    "lookalike": (d) => `The registrable domain closely resembles ${brand(d)}'s official one (the digit 0 for the letter o, `
      + `one character different, etc.)${official(d)}`,
    "brand-in-subdomain": (d) => `${brand(d)}'s name is in the subdomain. The owner is the registrable domain, not the subdomain${official(d)}`,
    "brand-in-path": (d) => `${brand(d)}'s name is in the path or query${official(d)}`,
    "bait-subdomain": (d) => `Words such as login or verify in the subdomain (${d.subdomain})`,
    "bait-path": () => "Words such as login or verify in the path or query",
    "bait-domain": (d) => `Words such as login or secure in the registrable domain name (${d.label})`,
    "hyphens": (d) => `Two or more hyphens in the registrable domain name (${d.label})`,
    "deep-subdomain": (d) => `Three or more levels of subdomains (${d.subdomain})`,
    "digits-mixed": (d) => `Letters and digits mixed in the registrable domain name (${d.label})`,
    "random-label": (d) => `${d.run} consonants in a row without a vowel in the registrable domain name (${d.label}). `
      + "Common in random strings made for throwaway domains",
    "download": (d) => `The path ends with .${d.ext}. Opening it may download a file`,
    "embedded-url": (d) => `Another URL inside the query (${d.url}). Sometimes used as a redirect target`,
    "base64": (d) => `A Base64-encoded string in the query or fragment. Decoded: "${d.decoded}". `
      + "Used to prefill an email address in a form or to hide the destination",
    "double-encoding": () => "Double encoding with %25. Sometimes used to slip past checks",
    "long": (d) => `${d.length} characters long. The destination part is easily pushed off the screen`,
    "bidi": (d) => `Characters that change text direction (${list(d.chars)}). They reorder what is shown, so a name ending in ".exe" `
      + 'can look like ".pdf". The content display replaces them with labels',
    "invisible": (d) => `Invisible characters (${list(d.chars)}). It looks the same, but the content differs. `
      + "Used to slip past checks or to look identical to a genuine name",
  };

  const evaluation = {
    jpcert: { name: "Phishing URLs published by JPCERT/CC (May 2026)", kind: "phish" },
    openphish: { name: "OpenPhish public feed (2026-10-07, the half not used for training)", kind: "phish" },
    crux: { name: "Sites frequently visited in Japan (CrUX August 2026 top 1,000, the half not used for training)", kind: "benign" },
    crux5k: { name: "Sites frequently visited in Japan (CrUX August 2026, ranks 1,001–5,000)", kind: "benign" },
    legit: { name: "Official login pages (25)", kind: "benign" },
  };

  const ui = {
    locale: "en-US",
    heading: { manual: "Result", qr: "QR code result" },
    total: (total, medium, high) => `${total} ${total === 1 ? "point" : "points"} (Medium at ${medium} or more, High at ${high} or more)`,
    content: "Content: ",
    owner: "Owner (registrable domain): ",
    ownerIp: "Destination (IP address): ",
    partsSummary: "Show the URL parts",
    partsCaption: "URL parts",
    signalsHeading: "Signs found",
    noSignals: "No signs were found.",
    ptsDanger: "High",
    ptsTrusted: "–",
    ptsDangerLabel: "High regardless of points",
    ptsLabel: (p) => `${p} ${p === 1 ? "point" : "points"}`,
    follow: "Check this URL",
    inspect: "Inspect each character in WeirdString Inspector",
    inspectHint: "Opens in a new tab. The content goes after the # in the URL, so it is never sent to the server.",
    makeQr: "Make a QR code of this content",
    qrAlt: "Generated QR code",
    qrSave: "Save as PNG",
    qrHint: "Useful for training materials and for testing scanners. When you show others a QR code of a fake URL, always say that it is for training.",
    qrTooLong: "Too long to fit in a QR code.",
    emptyInput: "Enter a URL or text to check.",
    sampleGroup: (name, n) => `${name} (${n})`,
    trustEmpty: "Nothing added yet",
    trustRemove: "Remove",
    trustRemoveLabel: (d) => `Remove ${d}`,
    trustInvalid: "Could not read that as a domain name (e.g., example.co.jp)",
    trustSuffix: (d) => `${d} is a public suffix and cannot be added (it would trust every site under it)`,
    trustAdded: (d) => `Added ${d} as trusted`,
    qrNoLibrary: "Could not load the QR code reader.",
    qrPreparing: "Starting the camera…",
    qrAim: "Point the camera so that the QR code is inside the frame.",
    qrNoCamera: "No camera was found. You can also choose an image.",
    qrCameraFailed: "Could not use the camera. Check the browser's camera permission.",
    qrStopped: "Camera stopped.",
    qrReading: "Reading the image…",
    qrRead: "Read successfully.",
    qrNotFound: "Could not read a QR code from this image. Make sure the whole code is visible and not blurred.",
    imageName: (name, kb) => `${name} (${kb} KB)`,
    accuracyLead: (phish, benign) => `Points and thresholds were set with ${phish} phishing URLs and ${benign} frequently visited sites `
      + "and login pages. The tables show rates measured on data not used for training.",
    accuracyHead: ["Data", "Count", "Medium or more", "High"],
  };

  const payload = {
    heading: "Content type",
    urlsHeading: "URLs inside",
    reveal: "Show",
    hide: "Hide",
    mask: (n) => `${"•".repeat(Math.min(n, 8))} (${n} characters)`,
    types: {
      wifi: "Wi-Fi settings", tel: "Phone number", sms: "Send SMS", mail: "Compose email", contact: "Contact", geo: "Location",
      otp: "Two-factor authentication key", crypto: "Crypto payment address", event: "Event", app: "Open an app", script: "Script", text: "Text",
    },
    fields: {
      ssid: "Network name (SSID)", security: "Security", password: "Password", hidden: "Hidden network", number: "Number", body: "Message",
      to: "To", subject: "Subject", name: "Name", org: "Organization", tel: "Phone", email: "Email", url: "URL", address: "Address", note: "Note",
      title: "Title", lat: "Latitude", lon: "Longitude", label: "Label", otpType: "Type", issuer: "Issuer", account: "Account", secret: "Secret key",
      algorithm: "Algorithm", digits: "Digits", period: "Period (seconds)", currency: "Currency", amount: "Amount", message: "Message",
      summary: "Summary", start: "Start", end: "End", location: "Location", description: "Description", package: "App package name",
      scheme: "Scheme", fallback: "URL opened when the app is missing", appId: "App Store ID",
    },
    value: (key, v) => {
      if (key === "security") {
        const k = String(v).toUpperCase();
        return { WPA: "WPA/WPA2", WPA2: "WPA2", SAE: "WPA3", WPA3: "WPA3", WEP: "WEP (outdated)", NOPASS: "None (not encrypted)" }[k] || v;
      }
      if (key === "hidden") return "Yes";
      return v;
    },
    notes: {
      "wifi-open": "An unencrypted network. People nearby may see your traffic. Often used for fake access points",
      "wifi-wep": "WEP is an outdated encryption method that can be broken in a short time",
      "wifi-hidden": "A hidden network. Devices that join it may keep asking for the network name around them",
      "wifi-check": "Before joining, check that the network name matches the shop's or venue's posted information",
      "tel-paid": "Numbers starting with 0570 or 0180 are information lines where the caller pays (Navi Dial, Teledome in Japan). "
        + "Flat-rate calling plans often do not cover them",
      "tel-intl": "An overseas number. International call charges apply",
      "tel-check": "Before calling, compare the number with the one on the official website or the bill",
      "sms-check": "Before sending, check the recipient and the message. If the message has a URL, check where it leads",
      "mail-check": "Before sending, check the recipient",
      "contact-urls": "The contact has a URL. Check where it leads before saving the contact",
      "geo-check": "A location opened in a map app. Compare it with the meeting place you expect",
      "otp-secret": "This contains a two-factor authentication secret key. Anyone who photographs this QR code can generate "
        + "the same codes. Do not show it to others, and close the screen once setup is done",
      "crypto-irreversible": "A crypto payment address. Transfers cannot be reversed. Confirm through another channel "
        + "that it matches the address in the invoice or donation notice",
      "event-urls": "The event has a URL. Check where it leads before opening it",
      "app-open": "This opens an app or an app store directly. Check which app it is before opening",
      "script-urls": "Destinations the script tries to open. Do not run the script itself",
      "text-urls": "The text contains URLs",
    },
  };

  const html = {
    tagline: "Breaks URLs and QR code contents into parts and counts signs commonly seen in phishing",
    langButton: "JA",
    langLabel: "Switch to Japanese",
    notice1: "The result is a rough guide based only on the shape of the URL. ",
    notice2: "\"No obvious signs\" does not mean safe.",
    notice3: " This tool never opens URLs or sends anything out (everything runs in this browser).",
    tablist: "Input method",
    tabManual: "Enter a URL or text",
    tabQr: "Read a QR code",
    payloadLabel: "URL or text to check",
    analyze: "Check",
    clear: "Clear",
    qrHint: "Read with the camera or choose an image that shows a QR code. Images are read only inside this browser and are never sent anywhere.",
    startCamera: "Read with camera",
    stopCamera: "Stop camera",
    pickImage: "Choose image",
    dropZone: "You can also drop an image here or paste it with Ctrl+V (⌘+V on Mac). Drop a link to check that URL.",
    imageAlt: "Chosen image",
    samplesTitle: "Try a sample",
    samplesHint: "Press one to put it in the input box and check it. The badge is this tool's result.",
    trustTitle: "Domains you trust",
    trustHint: "Add registrable domains you have verified yourself, such as your company's sites, to show them as \"Trusted\". "
      + "Saved only in this browser.",
    trustLabel: "Domain to trust",
    trustAdd: "Add",
    accuracyTitle: "How accurate is this? (measured)",
    accuracyPhish: "Phishing URLs detected",
    accuracyBenign: "Ordinary sites wrongly flagged",
    accuracyLimits: "Not used for the result: the page content, when the domain was registered, or whether it has been reported. "
      + "Fake sites whose URLs show no signs (such as hijacked ordinary sites) cannot be detected.",
  };

  root.QRTexts = root.QRTexts || {};
  root.QRTexts.en = {
    html,
    signals,
    evaluation,
    payload,
    ui,
    level: { high: "High", medium: "Medium", low: "No obvious signs", trusted: "Trusted (added by you)", other: "Not a URL", text: "Not assessed" },
    levelNote: {
      high: "Several signs commonly seen in phishing overlap. Do not open it; check through the official app or a bookmark.",
      medium: "There are signs worth checking. Confirm the sender and the destination before opening it.",
      low: (missRate) => "No obvious signs were found in the shape of the URL. This does not mean it is safe "
        + `(${missRate}% of the phishing URLs that JPCERT/CC published for May 2026 also get this result).`,
      trusted: "A registrable domain you added as trusted. It is not scored (signs are shown for reference).",
      danger: "This content runs a script on the spot or opens files on the device. Do not open it.",
      other: "Not a URL; it opens another app (phone, mail, SMS, Wi-Fi settings, etc.). It is not scored. Check the content before opening it.",
      text: "Not a URL. URL signs were not assessed.",
    },
    parts: {
      scheme: "Scheme", host: "Host", hostUnicode: "Host (display form)", registrable: "Registrable domain (determines the owner)",
      suffix: "Public suffix", subdomain: "Subdomain", port: "Port", path: "Path", query: "Query", fragment: "Fragment", username: "Before the @",
    },
    suffixSection: {
      icann: "ICANN section", private: "PRIVATE section (a service where anyone can create subdomains)",
      default: "Not in the list (the last label is treated as the suffix)",
    },
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
