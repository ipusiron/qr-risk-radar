// 画面の文言（日本語）。app.js は文言をここから引く（app.js に日本語の文字列を置かない）
// 兆候の説明は、兆候の ID ごとに detail（と点数）を受け取って1文を返す
(function (root) {
  "use strict";
  const list = (a) => (a || []).join("、");
  const official = (d) => (d.official && d.official.length ? `（公式: ${list(d.official)}）` : "");
  const scriptName = (s) => ({ Cyrillic: "キリル文字", Greek: "ギリシャ文字", "Japanese/Han": "日本語の文字", Other: "その他の文字" }[s] || s);

  const signals = {
    "danger-scheme": (d) => `${d.scheme}で始まる。開くとその場でスクリプトが動いたり、端末のファイルを開いたりする`
      + `${d.mime ? `（中身の種類: ${d.mime}）` : ""}。点数に関係なく「高」にする`,
    "other-scheme": (d) => `http・https以外のスキーム（${d.scheme}）。電話・メール・SMS・Wi-Fiの設定などを開く。開く前に中身を確かめる`,
    "http": () => "暗号化されていないhttp。途中で書き換えられるおそれがある。入力欄のあるページでは特に注意",
    "ip-host": (d) => `ドメイン名ではなくIPアドレス（${d.ip}）`
      + (d.written ? `。URLには「${d.written}」と書かれていた（10進・16進などの書き方でIPアドレスを読みにくくしている）` : ""),
    "userinfo": (d) => `@より前の「${d.user}」は飾りで、実際の行き先は@の後ろのホスト。本物の名前を@の前に置く罠`,
    "port": (d) => `既定でないポート番号（:${d.port}）`,
    "hosting": (d) => `${d.suffix}は、誰でもサブドメインを作れるサービス。持ち主はサービスの会社ではなく、そのサブドメインを作った人`,
    "shortener": (d) => `短縮URL（${d.domain}）。開くまで本当の行き先が見えない。短縮URLは普通にも使われるので、これだけでは「中」にしない`,
    "idn": (d) => `国際化ドメイン名（表示すると${d.unicode}）。日本語ドメインなど正当な使い方も多い`,
    "idn-mixed": (d) => `ラテン文字と${list(d.scripts.filter((s) => s !== "Latin").map(scriptName))}が混じったドメイン（表示すると${d.unicode}）。`
      + "キリル文字の「а」などで英字に見せかける手口（ホモグラフ）",
    "tld": (d, points) => `TLDは.${d.tld}${points > 0 ? "。学習用のフィッシングURLで、国内でよく開かれるサイトより多く出たTLD" : ""}`,
    "official": (d) => `${d.brand}の公式の登録ドメイン（このツールの一覧による）。ただし、改ざんされたページや公式サイトの転送機能の悪用は見分けられない`,
    "fake-official": (d) => `${d.brand}の公式ドメイン「${d.shown}」の文字列が、サブドメインかパスに入っている。`
      + `持ち主は登録ドメインで決まるので、これは${d.brand}のサイトではない${official(d)}`,
    "brand-other-tld": (d) => `${d.brand}の公式と同じ名前で、TLDだけが違う${official(d)}`,
    "brand-in-domain": (d) => `登録ドメインに${d.brand}の名前が入っているが、公式の登録ドメインではない${official(d)}`,
    "lookalike": (d) => `登録ドメインが${d.brand}の公式によく似ている（数字の0と英字のo、1文字違いなど）${official(d)}`,
    "brand-in-subdomain": (d) => `サブドメインに${d.brand}の名前がある。持ち主はサブドメインではなく登録ドメインのほう${official(d)}`,
    "brand-in-path": (d) => `パスやクエリに${d.brand}の名前がある${official(d)}`,
    "bait-subdomain": (d) => `サブドメイン（${d.subdomain}）にlogin・verifyなどの語`,
    "bait-path": () => "パスやクエリにlogin・verifyなどの語",
    "bait-domain": (d) => `登録ドメインの名前（${d.label}）にlogin・secureなどの語`,
    "hyphens": (d) => `登録ドメインの名前にハイフンが2つ以上（${d.label}）`,
    "deep-subdomain": (d) => `サブドメインが3段以上（${d.subdomain}）`,
    "digits-mixed": (d) => `登録ドメインの名前で英字と数字が混じる（${d.label}）`,
    "random-label": (d) => `登録ドメインの名前に、母音を挟まない子音が${d.run}文字続く（${d.label}）。使い捨てに作った無作為な文字列によくある`,
    "download": (d) => `パスが.${d.ext}で終わる。開くとファイルがダウンロードされるおそれ`,
    "embedded-url": (d) => `クエリの中に別のURL（${d.url}）。転送先として使われることがある`,
    "base64": (d) => `クエリやフラグメントにBase64で書いた文字列。戻すと「${d.decoded}」。`
      + "メールアドレスを入れて入力欄を埋めておく手口や、行き先を隠す手口がある",
    "double-encoding": () => "%25による二重のエンコード。検査をすり抜けるために使われることがある",
    "long": (d) => `${d.length}文字と長い。行き先の部分が画面の外に隠れやすい`,
  };

  // 学習に使っていないデータの説明（js/model.js の evaluation の id ごと。kind で表を分ける）
  const evaluation = {
    jpcert: { name: "JPCERT/CCが公開したフィッシングURL（2026年5月分）", kind: "phish" },
    openphish: { name: "OpenPhishの公開フィード（2026-10-07、学習に使わなかった半分）", kind: "phish" },
    crux: { name: "日本でよく開かれるサイト（CrUX 2026年8月の上位1000のうち、学習に使わなかった半分）", kind: "benign" },
    crux5k: { name: "日本でよく開かれるサイト（CrUX 2026年8月の1001〜5000位）", kind: "benign" },
    legit: { name: "公式のログインページ（25件）", kind: "benign" },
  };

  const ui = {
    locale: "ja-JP",
    heading: { manual: "判定", qr: "QRコードの判定" },
    total: (total, medium, high) => `${total}点（中は${medium}点以上、高は${high}点以上）`,
    content: "中身: ",
    owner: "持ち主を決める部分（登録ドメイン）: ",
    ownerIp: "行き先（IPアドレス）: ",
    partsSummary: "URLの部品を見る",
    partsCaption: "URLの部品",
    signalsHeading: "見つかった兆候",
    noSignals: "兆候は見つかりませんでした。",
    ptsDanger: "高",
    ptsTrusted: "－",
    ptsDangerLabel: "点数に関係なく高",
    ptsLabel: (p) => `${p}点`,
    follow: "このURLを調べる",
    makeQr: "この中身のQRコードを作る",
    qrAlt: "作ったQRコード",
    qrSave: "PNGで保存",
    qrHint: "訓練の資料や、読み取りの試験に使えます。偽のURLのQRコードを人に見せるときは、訓練用であることを必ず添えてください。",
    qrTooLong: "長すぎてQRコードにできませんでした。",
    emptyInput: "調べるURLまたは文字を入れてください。",
    sampleGroup: (name, n) => `${name}（${n}）`,
    trustEmpty: "まだ登録していません",
    trustRemove: "削除",
    trustRemoveLabel: (d) => `${d}を削除`,
    trustInvalid: "ドメイン名として読めませんでした（例: example.co.jp）",
    trustSuffix: (d) => `${d}は公開接尾辞なので登録できません（その下のサイトをすべて信頼することになるため）`,
    trustAdded: (d) => `${d}を信頼済みに登録しました`,
    qrNoLibrary: "QRコードを読む部品を読み込めませんでした。",
    qrPreparing: "カメラを準備しています…",
    qrAim: "QRコードを枠の中に写してください。",
    qrNoCamera: "カメラが見つかりませんでした。画像を選んで読むこともできます。",
    qrCameraFailed: "カメラを使えませんでした。ブラウザーのカメラの許可を確かめてください。",
    qrStopped: "カメラを止めました。",
    qrReading: "画像を読んでいます…",
    qrRead: "読み取りました。",
    qrNotFound: "この画像からQRコードを読み取れませんでした。QRコード全体が写っていて、ぼやけていないか確かめてください。",
    imageName: (name, kb) => `${name}（${kb} KB）`,
    accuracyLead: (phish, benign) => `点数と境目は、フィッシングURL ${phish}件と、よく開かれるサイトなど${benign}件で決めました。`
      + "下の表は、学習に使っていないデータで測った割合です。",
    accuracyHead: ["データ", "件数", "中以上", "高"],
  };

  // QR コードの中身の種類（js/payload-core.js の type・fields の key・notes の id ごと）
  const payload = {
    heading: "中身の種類",
    urlsHeading: "中に含まれるURL",
    reveal: "表示する",
    hide: "隠す",
    mask: (n) => `${"•".repeat(Math.min(n, 8))}（${n}文字）`,
    types: {
      wifi: "Wi-Fiの設定", tel: "電話番号", sms: "SMSの送信", mail: "メールの作成", contact: "連絡先", geo: "位置",
      otp: "2段階認証の鍵", crypto: "暗号資産の送金先", event: "予定", app: "アプリを開く", script: "スクリプト", text: "文",
    },
    fields: {
      ssid: "ネットワーク名（SSID）", security: "暗号方式", password: "パスワード", hidden: "隠しネットワーク", number: "番号", body: "本文",
      to: "宛先", subject: "件名", name: "名前", org: "組織", tel: "電話", email: "メール", url: "URL", address: "住所", note: "メモ",
      title: "肩書き", lat: "緯度", lon: "経度", label: "名前", otpType: "方式", issuer: "発行元", account: "アカウント", secret: "秘密鍵",
      algorithm: "アルゴリズム", digits: "桁数", period: "更新の間隔（秒）", currency: "通貨", amount: "金額", message: "メッセージ",
      summary: "件名", start: "開始", end: "終了", location: "場所", description: "説明", package: "アプリのパッケージ名",
      scheme: "スキーム", fallback: "アプリがないときに開くURL", appId: "App StoreのID",
    },
    // 値の読み替え（暗号方式・隠しネットワーク）
    value: (key, v) => {
      if (key === "security") {
        const k = String(v).toUpperCase();
        return { WPA: "WPA/WPA2", WPA2: "WPA2", SAE: "WPA3", WPA3: "WPA3", WEP: "WEP（古い方式）", NOPASS: "なし（暗号化されていない）" }[k] || v;
      }
      if (key === "hidden") return "はい";
      return v;
    },
    notes: {
      "wifi-open": "暗号化されていないネットワーク。通信を周りの人に見られるおそれがある。偽のアクセスポイントでもよく使われる",
      "wifi-wep": "WEPは古い暗号方式で、短い時間で破られる",
      "wifi-hidden": "隠しネットワークの設定。つないだ端末が、ネットワーク名を周りに問い合わせ続けることがある",
      "wifi-check": "つなぐ前に、店や施設の掲示・案内と同じネットワーク名か確かめる",
      "tel-paid": "0570・0180で始まる番号は、かけた側が通話料を払う案内用の番号（ナビダイヤル・テレドーム）。かけ放題の対象外のことが多い",
      "tel-intl": "海外の番号。国際電話の料金がかかる",
      "tel-check": "かける前に、公式サイトや請求書の番号と見比べる",
      "sms-check": "送る前に宛先と本文を確かめる。本文にURLがあれば、その行き先も確かめる",
      "mail-check": "送る前に宛先を確かめる",
      "contact-urls": "連絡先にURLがある。登録する前に行き先を確かめる",
      "geo-check": "地図アプリで開く位置。待ち合わせの場所などと見比べる",
      "otp-secret": "2段階認証の秘密鍵が入っている。このQRコードを撮られると、同じ確認コードを作られてしまう。人に見せず、設定が済んだら画面を閉じる",
      "crypto-irreversible": "暗号資産の送金先。送金は取り消せない。請求や寄付の案内と同じ宛先か、別の方法で確かめる",
      "event-urls": "予定にURLがある。開く前に行き先を確かめる",
      "app-open": "アプリやアプリストアを直接開く中身。開く前に、どのアプリかを確かめる",
      "script-urls": "スクリプトが開こうとする行き先。スクリプト自体は開かない",
      "text-urls": "文の中にURLがある",
    },
  };

  root.QRText = {
    signals,
    evaluation,
    payload,
    ui,
    level: { high: "高", medium: "中", low: "目立つ兆候なし", trusted: "信頼済み（自分で登録）", other: "URL以外", text: "判定の対象外" },
    levelNote: {
      high: "フィッシングでよく見る兆候が重なっています。開かずに、公式のアプリやブックマークから確かめてください。",
      medium: "気になる兆候があります。送り主と行き先を確かめてから開いてください。",
      low: (missRate) => "URLの形からは目立つ兆候が見つかりませんでした。安全という意味ではありません"
        + `（JPCERT/CCの2026年5月分のフィッシングURLでも${missRate}%はこの判定になります）。`,
      trusted: "自分で信頼済みに登録した登録ドメインです。点数では判定していません（兆候は参考として表示します）。",
      danger: "開くとその場でスクリプトが動いたり、端末のファイルを開いたりする中身です。開かないでください。",
      other: "URLではなく、ほかのアプリを開く中身です（電話・メール・SMS・Wi-Fiの設定など）。"
        + "点数での判定はしていません。開く前に中身を確かめてください。",
      text: "URLではない文字列です。URLの兆候の判定はしていません。",
    },
    parts: {
      scheme: "スキーム", host: "ホスト", hostUnicode: "ホスト（表示用の文字）", registrable: "登録ドメイン（持ち主を決める部分）",
      suffix: "公開接尾辞", subdomain: "サブドメイン", port: "ポート", path: "パス", query: "クエリ", fragment: "フラグメント", username: "@より前",
    },
    suffixSection: {
      icann: "ICANNの区分", private: "PRIVATEの区分（誰でもサブドメインを作れるサービス）", default: "一覧にない（最後のラベルを接尾辞とみなした）",
    },
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
