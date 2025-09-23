# QR Risk Radar - テスト用QRコードカタログ

QR Risk Radarのテスト用に生成された代表的な攻撃パターンのQRコード集です。

## 📁 ファイル構成（現在利用可能）

⚠️ **重要**: 現在、セキュリティテスト用に各攻撃カテゴリから代表的なテストケースのみが生成されています。

```
test/qr/
├── 01_homograph_attack.png        # ホモグラフ攻撃（PNG）
├── 01_homograph_attack.svg        # ホモグラフ攻撃（SVG）
├── 05_dangerous_scheme.png        # 危険なスキーム（PNG）
├── 05_dangerous_scheme.svg        # 危険なスキーム（SVG）
├── 09_shortened_url.png           # 短縮URL（PNG）
├── 09_shortened_url.svg           # 短縮URL（SVG）
├── 13_complex_attack.png          # 複合攻撃（PNG）
├── 13_complex_attack.svg          # 複合攻撃（SVG）
├── 14_safe_url.png                # 安全なURL（PNG）
└── 14_safe_url.svg                # 安全なURL（SVG）
```

### 📋 生成ステータス
- ✅ **生成済み**: 代表的テストケース 5個（PNG+SVG形式）
- ⏳ **未生成**: 全パターン（200+種類）
- 🎯 **目的**: 各攻撃カテゴリの基本的な検証
- 📱 **対応形式**: 
  - **PNG**: QRスキャナーアプリで読み取り可能
  - **SVG**: ブラウザー表示・印刷用（ベクター形式）

## 🎯 生成済み代表的テストケース

### ✅ 現在利用可能なQRコード

#### 01. ホモグラフ攻撃 [`01_homograph_attack.svg`] ✅
- **URL**: `https://аmazon.com/login`
- **カテゴリ**: フィッシング攻撃
- **リスクレベル**: High
- **攻撃手法**: キリル文字 'а' (U+0430) でAmazonを偽装
- **検出ルール**: Unicode偽装文字検出
- **期待スコア**: 3 (High)
- **ファイルサイズ**: 
  - **PNG**: 400x400px（約2-3KB）
  - **SVG**: 400x400px（約4-5KB）

#### 05. 危険なスキーム [`05_dangerous_scheme.svg`] ✅
- **URL**: `javascript:alert('XSS Test')`
- **カテゴリ**: 技術的脅威
- **リスクレベル**: High
- **攻撃手法**: JavaScript直接実行によるXSS攻撃
- **検出ルール**: 危険なスキーム検出
- **期待スコア**: 3 (High)
- **ファイルサイズ**: 
  - **PNG**: 400x400px（約2-3KB）
  - **SVG**: 400x400px（約4-5KB）

#### 09. 短縮URL [`09_shortened_url.svg`] ✅
- **URL**: `https://bit.ly/3xY9Abc`
- **カテゴリ**: 難読化・隠蔽
- **リスクレベル**: Medium
- **攻撃手法**: 実際の遷移先が不明な短縮URLサービスを悪用
- **検出ルール**: 短縮URL検出
- **期待スコア**: 2 (Medium)
- **ファイルサイズ**: 
  - **PNG**: 400x400px（約2-3KB）
  - **SVG**: 400x400px（約4-5KB）

#### 13. 複合攻撃（超高リスク） [`13_complex_attack.svg`] ✅
- **URL**: `javascript:window.location='http://192.168.1.1:8080/malware.exe'`
- **カテゴリ**: 複合攻撃
- **リスクレベル**: High
- **攻撃手法**: 危険スキーム+IPアドレス+非標準ポート+実行ファイル
- **検出ルール**: 複数ルール同時検出
- **期待スコア**: 7+ (High)
- **ファイルサイズ**: 
  - **PNG**: 400x400px（約2-3KB）
  - **SVG**: 400x400px（約4-5KB）

#### 14. 安全なURL [`14_safe_url.svg`] ✅
- **URL**: `https://www.google.com/`
- **カテゴリ**: 正常URL
- **リスクレベル**: Safe
- **攻撃手法**: なし（偽陽性チェック用）
- **検出ルール**: なし
- **期待スコア**: 0 (Safe)
- **ファイルサイズ**: 
  - **PNG**: 400x400px（約2-3KB）
  - **SVG**: 400x400px（約4-5KB）

## 🧪 テスト実行方法

### 📱 基本テスト手順

#### 1. QRコードスキャンテスト
```bash
# 1. メインアプリケーションを開く
open ../index.html

# 2. QRスキャナータブを開く
# 3. 「カメラ開始」をクリック
# 4. test/qr/ 内のSVGファイルを画面に表示してスキャン
```

#### 2. 画像アップロードテスト
```bash
# 1. QRスキャナータブで「画像を選択」
# 2. test/qr/ 内のPNGファイルを選択（推奨）
# 3. 自動解析結果を確認

# ⚠️ 注意: SVGファイルはQRスキャナーで読み取れない場合があります
# PNG形式のファイルを使用してください
```

### 📊 期待される結果

各QRコードをスキャンした際の期待される結果：

| ファイル名 | 期待リスクレベル | 主要検出項目 | 期待スコア |
|------------|-----------------|------------|------------|
| `01_homograph_attack.svg` | High | Unicode偽装文字 | 3 |
| `05_dangerous_scheme.svg` | High | 危険なスキーム | 3 |
| `09_shortened_url.svg` | Medium | 短縮URL | 2 |
| `13_complex_attack.svg` | High | 複数ルール | 7+ |
| `14_safe_url.svg` | Safe | なし | 0 |

### ⚠️ セキュリティ注意事項

- これらのQRコードは**テスト目的のみ**で使用してください
- 実際のWebサイトにアクセスしないでください
- 特に`javascript:`スキームのQRコードは実行しないでください
- テスト環境でのみ使用し、本番環境では使用しないでください

---

## 🎯 全QRコード詳細一覧（仕様書）

### 🎯 フィッシング攻撃カテゴリ

#### 01. ホモグラフ攻撃 [`01_homograph_attack.svg`]
- **URL**: `https://аmazon.com/login`
- **リスクレベル**: High
- **攻撃手法**: キリル文字 'а' (U+0430) でAmazonを偽装
- **検出ルール**: Unicode偽装文字検出
- **期待スコア**: 3+ (High)

#### 02. タイポスクワッティング [`02_typosquatting.svg`]
- **URL**: `https://g00gle.com/search`
- **リスクレベル**: High  
- **攻撃手法**: 文字置換（o→0）でGoogleを偽装
- **検出ルール**: タイポスクワッティング検出
- **期待スコア**: 3+ (High)

#### 03. フィッシングドメイン [`03_phishing_domain.svg`]
- **URL**: `https://login-amazon.secure-verification.com`
- **リスクレベル**: Medium
- **攻撃手法**: 正規サービス名を含む偽ドメインで信頼性を装う
- **検出ルール**: フィッシングキーワード検出
- **期待スコア**: 2 (Medium)

#### 04. 疑わしいTLD [`04_suspicious_tld.svg`]
- **URL**: `http://secure-paypal.verification.tk/login`
- **リスクレベル**: Medium
- **攻撃手法**: 信頼性の低い.tkドメインを悪用
- **検出ルール**: HTTP + 疑わしいTLD + フィッシングキーワード
- **期待スコア**: 4 (Medium)

---

### ⚠️ 技術的脅威カテゴリ

#### 05. 危険なスキーム [`05_dangerous_scheme.svg`]
- **URL**: `javascript:alert('XSS Test')`
- **リスクレベル**: High
- **攻撃手法**: JavaScript直接実行によるXSS攻撃
- **検出ルール**: 危険なスキーム検出
- **期待スコア**: 3 (High)

#### 06. IPアドレス直接指定 [`06_ip_address.svg`]
- **URL**: `http://192.168.1.1/admin`
- **リスクレベル**: Medium
- **攻撃手法**: ドメイン名ではなく直接IPアドレス使用
- **検出ルール**: HTTP + IPアドレス検出
- **期待スコア**: 4 (Medium)

#### 07. 実行ファイルDL [`07_executable_download.svg`]
- **URL**: `https://download.com/malware.exe`
- **リスクレベル**: High
- **攻撃手法**: マルウェアの直接ダウンロードリンク
- **検出ルール**: 実行可能ファイル検出
- **期待スコア**: 3 (High)

#### 08. 非標準ポート [`08_non_standard_port.svg`]
- **URL**: `https://example.com:8080/admin`
- **リスクレベル**: Low
- **攻撃手法**: 通常と異なるポート番号の使用
- **検出ルール**: 非標準ポート検出
- **期待スコア**: 1 (Low)

---

### 🫥 難読化・隠蔽カテゴリ

#### 09. 短縮URL [`09_shortened_url.svg`]
- **URL**: `https://bit.ly/3xY9Abc`
- **リスクレベル**: Medium
- **攻撃手法**: 実際の遷移先が不明な短縮URLサービスを悪用
- **検出ルール**: 短縮URL検出
- **期待スコア**: 2 (Medium)

#### 10. Base64難読化 [`10_base64_obfuscation.svg`]
- **URL**: `https://example.com/path?data=aHR0cDovL2V2aWwuY29tL21hbHdhcmUuZXhl`
- **リスクレベル**: Medium
- **攻撃手法**: Base64でエンコードされた悪意あるURL（デコード: `http://evil.com/malware.exe`）
- **検出ルール**: Base64難読化検出 + 自動デコード
- **期待スコア**: 2 (Medium)

#### 11. Data URI攻撃 [`11_data_uri_attack.svg`]
- **URL**: `data:text/html,<script>alert('XSS')</script>`
- **リスクレベル**: High
- **攻撃手法**: Data URIを使った悪意あるコードの直接実行
- **検出ルール**: Data URI攻撃検出
- **期待スコア**: 3 (High)

#### 12. オープンリダイレクト [`12_open_redirect.svg`]
- **URL**: `https://example.com/redirect?url=http://evil.com`
- **リスクレベル**: Medium
- **攻撃手法**: 正規サイト経由で悪意あるサイトへ誘導
- **検出ルール**: オープンリダイレクト検出
- **期待スコア**: 2 (Medium)

---

### 💥 複合攻撃カテゴリ

#### 13. 複合攻撃（超高リスク） [`13_complex_attack.svg`]
- **URL**: `javascript:window.location='http://192.168.1.1:8080/malware.exe'`
- **リスクレベル**: High
- **攻撃手法**: 危険スキーム + IPアドレス + 非標準ポート + 実行ファイル
- **検出ルール**: 複数ルール同時検出
- **期待スコア**: 7+ (High)

---

### ✅ 正常URLカテゴリ

#### 14. 安全なURL [`14_safe_url.svg`]
- **URL**: `https://www.google.com/`
- **リスクレベル**: Safe
- **攻撃手法**: なし（偽陽性チェック用）
- **検出ルール**: なし
- **期待スコア**: 0 (Safe)

---

## 🧪 テスト使用方法

### 1. 基本的なテスト手順

#### カメラスキャンテスト
```bash
# 1. メインアプリケーションを開く
open ../index.html

# 2. QRスキャナータブを開く
# 3. 「カメラ開始」をクリック
# 4. test/qr/ 内のSVGファイルを画面に表示してスキャン
```

#### 画像アップロードテスト
```bash
# 1. QRスキャナータブで「画像を選択」
# 2. test/qr/ 内のSVGファイルを選択
# 3. 自動解析結果を確認
```

### 2. 期待される結果の検証

各QRコードをスキャンした際の期待される結果：

| ファイル名 | 期待リスクレベル | 主要検出項目 | 期待スコア範囲 |
|------------|-----------------|------------|----------------|
| `01_homograph_attack.svg` | High | Unicode偽装文字 | 3+ |
| `02_typosquatting.svg` | High | タイポスクワッティング | 3+ |
| `03_phishing_domain.svg` | Medium | フィッシングキーワード | 2 |
| `04_suspicious_tld.svg` | Medium | HTTP+疑わしいTLD | 4 |
| `05_dangerous_scheme.svg` | High | 危険なスキーム | 3 |
| `06_ip_address.svg` | Medium | HTTP+IPアドレス | 4 |
| `07_executable_download.svg` | High | 実行ファイルDL | 3 |
| `08_non_standard_port.svg` | Low | 非標準ポート | 1 |
| `09_shortened_url.svg` | Medium | 短縮URL | 2 |
| `10_base64_obfuscation.svg` | Medium | Base64難読化 | 2 |
| `11_data_uri_attack.svg` | High | Data URI攻撃 | 3 |
| `12_open_redirect.svg` | Medium | オープンリダイレクト | 2 |
| `13_complex_attack.svg` | High | 複数ルール | 7+ |
| `14_safe_url.svg` | Safe | なし | 0 |

### 3. 自動テスト例

```javascript
// QRコードテスト自動化スクリプト
const testCases = [
    {file: '01_homograph_attack.svg', expectedLevel: 'High', expectedScore: 3},
    {file: '02_typosquatting.svg', expectedLevel: 'High', expectedScore: 3},
    // ... 他のケース
];

testCases.forEach(testCase => {
    // 各QRコードをスキャン
    // 結果を期待値と比較
    // レポート生成
});
```

## 📊 テストレポート例

```
🧪 QR Risk Radar QRコードテスト実行結果
実行日時: 2024-XX-XX XX:XX:XX
=====================================

✅ 01_homograph_attack.svg: High (Score: 3) - PASS
✅ 02_typosquatting.svg: High (Score: 3) - PASS  
✅ 03_phishing_domain.svg: Medium (Score: 2) - PASS
❌ 04_suspicious_tld.svg: Low (Score: 2) - FAIL (期待: Medium)
...

総合結果: 13/14 PASS (92.9%)
```

## 🔧 QRコード再生成

QRコードを再生成する場合：

```bash
# Node.jsスクリプトで一括再生成
cd test/
node generate-qr-batch.js

# 個別生成（ブラウザー）
open qr-generator-batch.html
```

## ⚠️ セキュリティ注意事項

- これらのQRコードは**テスト目的のみ**で使用してください
- 実際のWebサイトにアクセスしないでください
- 特に`javascript:`スキームのQRコードは実行しないでください
- テスト環境でのみ使用し、本番環境では使用しないでください

---

このQRコードカタログにより、QR Risk Radarの**全機能を体系的にテスト**できます。各攻撃パターンの理解も深まり、セキュリティ教育にも活用できます。