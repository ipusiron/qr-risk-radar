# QR Risk Radar - テストケース集

QR Risk Radarの動作確認・実験用のテストケース集です。

あらゆる脅威パターンとエッジケースをカバーしています。

## 📋 テストカテゴリ

### 1. フィッシング攻撃テスト

#### 1.1 ホモグラフ攻撃（Unicode偽装）
```
https://аmazon.com/login          # キリル文字 'а' (U+0430)
https://gοοgle.com/search        # ギリシャ文字 'ο' (U+03BF)
https://microsoft.com/sign1n     # 数字 '1' を 'i' に偽装
https://раypal.com/payment       # キリル文字混在
https://аpple.com/store          # 視覚的に区別困難
```

#### 1.2 タイポスクワッティング
```
https://g00gle.com/search        # o→0 置換
https://amaz0n.com/buy           # o→0 置換
https://micr0soft.com/office     # o→0 置換
https://fac3book.com/login       # e→3 置換
https://twitt3r.com/home         # e→3 置換
https://gith7b.com/login         # u→7 置換
https://qoogle.com/search        # g→q 置換
```

#### 1.3 フィッシングドメイン構造
```
https://amazon-security.com/verify
https://login-paypal-secure.net/confirm
https://microsoft-account-verification.org
https://secure-amazon-payment.info
https://paypal-verification-center.com
https://apple-id-unlock.net/restore
https://facebook-security-check.org
```

#### 1.4 疑わしいTLD
```
http://secure-bank.tk/login
https://payment-service.ml/pay
http://verification.ga/confirm
https://security-check.cf/verify
http://account-restore.men/reset
https://login-portal.click/signin
https://download-center.download/get
```

### 2. 技術的脅威テスト

#### 2.1 危険なスキーム
```
javascript:alert('XSS Test')
javascript:window.location='http://evil.com'
data:text/html,<script>alert('XSS')</script>
data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=
file:///etc/passwd
vbscript:msgbox("VBS Test")
```

#### 2.2 IPアドレス直接指定
```
http://192.168.1.1/admin
https://10.0.0.1:8080/login
http://172.16.0.1/config
https://127.0.0.1:3000/dashboard
http://203.0.113.1/secure
https://198.51.100.1:9443/portal
```

#### 2.3 難読化IPアドレス
```
http://0177.0000.0000.0001/        # 8進数表記
https://0x7f000001/admin           # 16進数表記
http://2130706433/login            # 整数表記
http://0x0a.0x00.0x00.0x01/        # 混合表記
https://0300.0000.0000.0001:8080/  # 8進数+ポート
```

#### 2.4 非標準ポート
```
https://example.com:8080/admin
http://secure.com:3128/proxy
https://portal.org:9443/login
http://service.net:8888/api
https://admin.com:4443/panel
http://test.io:5000/debug
```

### 3. 難読化・隠蔽テスト

#### 3.1 短縮URL
```
https://bit.ly/3xY9Abc
https://t.co/abcd1234
http://tinyurl.com/test123
https://is.gd/shortlink
http://cutt.ly/sample
https://goo.gl/maps
https://ow.ly/example
```

#### 3.2 短縮URL連鎖（高リスク）
```
https://bit.ly/redirect?url=http://evil.com
https://t.co/link?redirect=malware.exe
http://tinyurl.com/go?next=javascript:alert('xss')
```

#### 3.3 Base64エンコード
```
# "http://evil.com/malware.exe" をBase64エンコード
https://example.com/path?data=aHR0cDovL2V2aWwuY29tL21hbHdhcmUuZXhl

# "javascript:alert('hack')" をBase64エンコード  
https://service.com/exec?code=amF2YXNjcmlwdDphbGVydCgnaGFjaycp

# 長いBase64文字列（疑わしい）
https://test.com/load?payload=VGhpcyBpcyBhIHZlcnkgbG9uZyBCYXNlNjQgZW5jb2RlZCBzdHJpbmcgdGhhdCBtaWdodCBjb250YWluIHNvbWV0aGluZyBzdXNwaWNpb3Vz
```

#### 3.4 Hexエンコード（過剰）
```
https://example.com/%65%78%65%63%75%74%65%2E%65%78%65
http://test.com/%6D%61%6C%77%61%72%65%2E%62%61%74
```

#### 3.5 二重URLエンコード
```
https://example.com/redirect?url=%2568%2574%2574%2570%253A%252F%252F%2565%2576%2569%256C%252E%2563%256F%256D
```

#### 3.6 Unicodeエスケープ
```
https://example.com/\u0065\u0078\u0065\u0063\u0075\u0074\u0065
```

### 4. オープンリダイレクトテスト

#### 4.1 基本的なオープンリダイレクト
```
https://legitimate.com/redirect?url=http://evil.com
https://trusted.org/goto?next=https://malicious.net
https://example.com/forward?dest=http://phishing.com
https://service.com/jump?target=http://scam.org
```

#### 4.2 パラメーター名バリエーション
```
https://example.com/?redirect=http://evil.com
https://example.com/?next=http://evil.com
https://example.com/?dest=http://evil.com
https://example.com/?return=http://evil.com
https://example.com/?continue=http://evil.com
https://example.com/?callback=http://evil.com
```

### 5. マルウェア・実行ファイルテスト

#### 5.1 実行可能ファイル
```
https://download.com/software.exe
http://files.org/installer.msi
https://apps.net/program.scr
http://tools.com/utility.bat
https://software.org/app.cmd
http://downloads.net/package.com
```

#### 5.2 アーカイブファイル
```
https://files.com/archive.zip
http://downloads.org/package.rar
https://storage.net/backup.7z
http://shares.com/data.tar.gz
```

#### 5.3 Data URI攻撃
```
data:text/html,<script>alert('XSS')</script>
data:application/javascript,alert('JS Execution')
data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=
data:application/x-msdownload;base64,TVqQAAMAAAAEAAAA
```

### 6. プライバシー・トラッキングテスト

#### 6.1 過剰なトラッキングパラメーター
```
https://example.com/?utm_source=email&utm_medium=newsletter&utm_campaign=promo&fbclid=abc123&gclid=def456&msclkid=ghi789
```

### 7. 構造的異常テスト

#### 7.1 長すぎるURL（200文字超）
```
https://verylongdomainnamethatisveryverylongandprobablynotlegitimateandmightbeusedformaliciouspurposes.com/very/long/path/that/goes/on/and/on/and/never/seems/to/end/with/many/segments
```

#### 7.2 過剰なクエリパラメーター（15個以上の&）
```
https://example.com/?a=1&b=2&c=3&d=4&e=5&f=6&g=7&h=8&i=9&j=10&k=11&l=12&m=13&n=14&o=15&p=16&q=17
```

#### 7.3 長いフラグメント（60文字超）
```
https://example.com/page#verylongfragmentthatexceedssixtycharactersandmightbehiding
```

### 8. 複合攻撃テスト（高リスク）

#### 8.1 複数要素の組み合わせ
```
javascript:window.location='http://192.168.1.1:8080/malware.exe'  # 危険スキーム+IP+非標準ポート+実行ファイル
http://аmazon-security.tk/login?redirect=http://evil.com          # Unicode偽装+疑わしいTLD+オープンリダイレクト
https://bit.ly/go?url=data:text/html,<script>alert('xss')</script> # 短縮URL+Data URI攻撃
```

### 9. エッジケース・境界値テスト

#### 9.1 正常に近いが疑わしいケース
```
https://amazon.co.uk/           # 正規だが地域違い
https://google.com.evil.org/    # 正規ドメインを含むが偽装
https://example.com:443/        # HTTPS標準ポートを明示
http://example.com:80/          # HTTP標準ポートを明示
```

#### 9.2 境界値テスト
```
# ちょうど200文字
https://test.com/123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678

# 14個の&（境界値）
https://example.com/?a=1&b=2&c=3&d=4&e=5&f=6&g=7&h=8&i=9&j=10&k=11&l=12&m=13&n=14

# 60文字のフラグメント（境界値）
https://example.com/#123456789012345678901234567890123456789012345678901234567890
```

### 10. 正常URLテスト（偽陽性チェック）

#### 10.1 完全に安全なURL
```
https://www.google.com/
https://github.com/microsoft/vscode
https://www.amazon.com/books
https://developer.mozilla.org/docs
https://stackoverflow.com/questions
```

#### 10.2 安全だが警告が出るURL
```
http://httpbin.org/get          # HTTP使用（+2スコア）
https://example.com:8443/       # 非標準ポート（+1スコア）
```

## 🧪 テスト実行方法

### 手動テスト
1. 上記URLをコピー
2. QR Risk Radarの手動入力タブに貼り付け
3. 「分析する」をクリック
4. 期待されるリスクレベルと検出内容を確認

### QRコードテスト
1. オンラインQRジェネレータで上記URLのQRコードを生成
2. QRスキャナータブで画像をアップロード
3. デコード結果と分析結果を確認

### 期待される結果例

| URL | 期待リスクレベル | 主要検出項目 |
|-----|-----------------|------------|
| `javascript:alert('test')` | High | 危険なスキーム |
| `https://аmazon.com/login` | High | Unicode偽装文字 |
| `http://192.168.1.1/admin` | Medium | HTTP+IPアドレス |
| `https://bit.ly/test` | Medium | 短縮URL |
| `https://example.com:8080/` | Low | 非標準ポート |

## 📊 自動テストスクリプト

### JavaScript自動テスト（ブラウザーコンソール用）
```javascript
// 全テストケースの自動実行
const testCases = [
  {url: "javascript:alert('test')", expected: "High"},
  {url: "https://аmazon.com/login", expected: "High"},
  {url: "http://192.168.1.1/admin", expected: "Medium"},
  // ... 他のテストケース
];

testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.url}`);
  // analysePayload関数を呼び出してテスト
  const result = analysePayload(test.url);
  console.log(`Expected: ${test.expected}, Actual: ${result.level}`);
  console.log('---');
});
```

## 🔧 カスタムテストケース作成

独自のテストケースを作成する場合の指針：

1. **特定の検出ルールをテスト**: 1つのルールのみトリガーするURL
2. **複合パターンをテスト**: 複数ルールを同時にトリガー
3. **境界値をテスト**: スコア境界値（2/3, 5/6）でのレベル判定
4. **偽陽性をテスト**: 安全だが警告が出るケース
5. **偽陰性をテスト**: 危険だが検出されない可能性があるケース

## 🛡️ セキュリティ注意事項

⚠️ **重要**: 
- 上記URLは**テスト目的のみ**で使用してください
- 実際にアクセスしないでください（特にjavascript:スキーム）
- 本番環境では使用しないでください
- QRコード生成時も実際のアクセスを避けてください

これらのテストケースにより、QR Risk Radarの全機能を網羅的に検証できます。