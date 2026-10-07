# セキュリティ

QR Risk Radarが実装している安全対策と、問題を見つけたときの連絡先です。ここに書いたものは、すべて現在の版で実装されています。

## 外部に送らない

- 入力したURL・文字、読み取ったQRコードの中身、選んだ画像は、ブラウザーの外へ送らない。URLを開くこともしない（画面にリンクとして置かない）
- 判定に使うデータ（公開接尾辞の一覧・点数）は、すべてリポジトリーの中のファイルから読む
- 外部のサーバーに問い合わせる機能（ドメインの登録日、通報済みの一覧など）は持たない
- 「WeirdString Inspectorで1文字ずつ見る」を押したときだけ、同じサイトのWeirdString Inspector（Day023）を新しいタブで開き、中身をURLの#の後ろに入れて渡す（`rel="noopener noreferrer"`）。#の後ろはサーバーへ送られない。Day023は読み込んだあとタブのURLと戻る・進むの履歴から中身を消すが、ブラウザーの閲覧履歴には最初のURLが残る（EdgeとFirefoxで確かめた）。日本語や見えない文字を含まない中身では、このボタンを出さない

## Content Security Policy

`index.html`のmeta要素で次の値を設定しています。

```text
default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; worker-src blob:; base-uri 'none'; form-action 'none'; object-src 'none'
```

- スクリプトとスタイルは同じ場所のファイルだけを読む。インラインのスクリプト・イベントハンドラー属性・style属性を使わない
- `img-src data: blob:`は、選んだ画像の表示（`blob:`）と、作ったQRコードの画像（`data:`）のため
- `worker-src blob:`は、QRコードのデコーダー（qr-scanner）が`Blob`からワーカーを作るため
- `connect-src`を許していないので、ページから外部へ通信できない
- Apacheに置く場合の`.htaccess`も同じ値に`frame-ancestors 'none'`を足している（GitHub Pagesはこのファイルを使わない）
- `<meta name="referrer" content="no-referrer">`を入れている

## 外部のライブラリー

- QRコードの読み取り（qr-scanner 1.4.2）と生成（qrcode-generator 2.0.4）は、npmの配布物から取り出して`vendor/`に置いている。CDNから読まない
- `vendor/`のファイルは1バイトも変えておらず、`test/vendor.test.js`がSHA-256を照合する（出所は`vendor/README.md`）
- qr-scannerのデコーダーは、ESモジュールの`export`だけを外した`js/qr-worker.js`から作る（`tools/build-worker.mjs`が生成し、テストが元のファイルとの一致を確かめる）。Chromium・Edgeは`file://`で開いたページの`import()`を拒むため

## 描画

- 入力やQRコードの中身は`textContent`で描画する。`innerHTML`・`eval`・`new Function`を使わない（`test/html.test.js`が検査する）
- 向きを変える文字（RLOなど）と見えない文字は、`[RLO U+202E]`のような印に置き換えて描画する。生の中身を出す欄は`unicode-bidi: bidi-override; direction: ltr`で並び順どおりに表示し、表示の反転で中身を偽れないようにする
- 調べる中身にURLが含まれていても、`<a>`にしない。行き先を開くには、利用者が自分でコピーする必要がある

## 保存するもの

- 「自分で信頼するドメイン」を`localStorage`（キー`qr-risk-radar-whitelist`）に保存する。読み込むときはドメイン名として正しいものだけを残し、公開接尾辞（`co.jp`・`pages.dev`など）は登録させない
- 画面の言語（`ja`か`en`）を`localStorage`（キー`qr-risk-radar-lang`）に保存する。言語のボタンを押したときだけ保存する
- 読み取ったQRコードの中身（Wi-Fiのパスワード・2段階認証の秘密鍵を含む）は保存しない。パスワードと秘密鍵は伏せて表示し、ボタンを押したときだけ見せる
- `localStorage`が使えない環境でも、開いている間は動く

## 問題の報告

セキュリティの問題を見つけたときは、GitHubのリポジトリー（[ipusiron/qr-risk-radar](https://github.com/ipusiron/qr-risk-radar)）のIssueで知らせてください。

## 注意

- 判定はURLの形だけを見た目安です。「目立つ兆候なし」は安全という意味ではありません（[SCORING.md](SCORING.md)の「限界」）
- 判定の結果だけで、URLを開くかどうかを決めないでください。送り主や公式のアプリ・ブックマークで確かめてください
