// 学習用のサンプル。画面のボタンとsamples/qr/のQR画像の元になる（判定の結果はtest/samples.test.jsが確かめる）
// ドメインは、例示用に予約された.example・example.comを使う（実在のサイトを指さない）。
// TLDや無料ホスティングの例だけは実在のTLD・サービス名を使うが、ホスト名は架空のもの
(function (root) {
  "use strict";
  root.QRSamples = [
    {
      group: "偽物を本物に見せる",
      items: [
        { id: "fake-official", title: "公式ドメインを前に置く", url: "https://paypal.com.secure-login.example/verify",
          note: "paypal.comはサブドメインの飾り。持ち主はsecure-login.example", expect: "high", signal: "fake-official", qr: 1 },
        { id: "lookalike", title: "数字の0で似せる", url: "https://amaz0n.example/signin",
          note: "amaz0nの0は数字。公式によく似た名前", expect: "high", signal: "lookalike" },
        { id: "userinfo", title: "@の前に本物の名前", url: "https://www.amazon.co.jp@login-check.example/",
          note: "@より前は飾り。行き先はlogin-check.example", expect: "high", signal: "userinfo", qr: 2 },
        { id: "homograph", title: "キリル文字で似せる", url: "https://аpple.example/",
          note: "先頭の「а」はキリル文字。見た目はapple", expect: "high", signal: "idn-mixed", qr: 3 },
        { id: "fake-path", title: "パスに公式ドメイン", url: "https://shop-news.example/vpass.ne.jp/login/",
          note: "国内の偽サイトに多い形。パスのvpass.ne.jpは飾り", expect: "high", signal: "fake-official" },
        { id: "hosting", title: "無料ホスティングにブランド名", url: "https://eki-net-login.pages.dev/",
          note: "pages.devは誰でもサブドメインを作れる。持ち主は作った人", expect: "high", signal: "hosting", qr: 4 },
      ],
    },
    {
      group: "使い捨てのドメイン",
      items: [
        { id: "random", title: "無作為な文字列のドメイン", url: "https://vzqxkwtr.top/jp/",
          note: "名前に意味がない。JPCERT/CCの2026年5月分の37.4%に出た、最も多い兆候", expect: "high", signal: "random-label", qr: 5 },
        { id: "bait-domain", title: "ドメイン名にsecure・account", url: "https://secure-account-update.example/",
          note: "それらしい語を並べたドメイン", expect: "high", signal: "bait-domain" },
      ],
    },
    {
      group: "行き先を隠す",
      items: [
        { id: "ip", title: "10進数で書いたIPアドレス", url: "http://3232235777/login",
          note: "3232235777は192.168.1.1の別の書き方", expect: "high", signal: "ip-host" },
        { id: "shortener", title: "短縮URL", url: "https://bit.ly/3xY9Abc",
          note: "行き先が見えない。ただし短縮URLだけでは「中」にしない", expect: "low", signal: "shortener", qr: 6 },
        { id: "redirect", title: "URLの中に別のURL", url: "https://example.com/redirect?url=https://login-check.example/",
          note: "転送先を調べるボタンで、埋め込まれたURLも判定できる", expect: "low", signal: "embedded-url" },
        { id: "base64", title: "Base64で隠した行き先", url: "https://example.com/track?data=aHR0cHM6Ly9sb2dpbi1jaGVjay5leGFtcGxlLw",
          note: "戻すとhttps://login-check.example/", expect: "low", signal: "base64" },
        { id: "download", title: "二重の拡張子のファイル", url: "https://files.example/invoice.pdf.exe",
          note: "最後の拡張子は.exe。開くとファイルが落ちてくる", expect: "low", signal: "download" },
      ],
    },
    {
      group: "URLではないもの",
      items: [
        { id: "javascript", title: "javascript:スキーム", url: "javascript:alert('QR Risk Radar')",
          note: "開くとその場でスクリプトが動く", expect: "high", signal: "danger-scheme", qr: 7 },
        { id: "data", title: "data:スキーム", url: "data:text/html,<h1>QR Risk Radar</h1>",
          note: "URLの中にHTMLをそのまま入れる", expect: "high", signal: "danger-scheme" },
        { id: "wifi", title: "Wi-Fiの設定", url: "WIFI:T:WPA;S:Free-Cafe-WiFi;P:12345678;;",
          note: "つなぐ前に、店の掲示と同じネットワーク名か確かめる", expect: "low", signal: "other-scheme", qr: 8 },
      ],
    },
    {
      group: "本物（比べるため）",
      items: [
        { id: "official", title: "Amazonの公式のログイン", url: "https://www.amazon.co.jp/ap/signin",
          note: "登録ドメインはamazon.co.jp", expect: "low", signal: "official", qr: 9 },
        { id: "official-jp", title: "日本郵便の公式", url: "https://www.post.japanpost.jp/",
          note: "登録ドメインはjapanpost.jp", expect: "low", signal: "official" },
      ],
    },
  ];
})(typeof globalThis !== "undefined" ? globalThis : this);
