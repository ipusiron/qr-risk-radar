# QR Risk Radar - テスト実行ガイド

QR Risk Radarの包括的テストを実行するための詳細ガイドです。

## 📁 テストファイル構成

```
qr-risk-radar/
├── test/
│   ├── TEST_CASES.md          # 全テストケース集（200+パターン）
│   ├── test-qr-generator.html # QRコード生成ツール
│   └── TESTING_GUIDE.md      # このファイル
└── index.html                # メインアプリケーション
```

## 🚀 クイックスタート

### 1. 基本機能テスト（5分）
```bash
# 1. メインアプリケーションを開く
open ../index.html

# 2. 手動入力タブで基本テスト
テスト入力: javascript:alert('test')
期待結果: High リスク、「危険なスキーム」検出

# 3. QRスキャナータブで画像テスト
テスト用QRコード生成: test-qr-generator.html を開く
```

### 2. QRコード生成とテスト（10分）
```bash
# 1. QRコード生成ツールを開く
open test-qr-generator.html

# 2. 「全QRコード生成」をクリック
# 3. 各QRコードを ../index.html でスキャンテスト
```

## 🧪 詳細テスト手順

### Phase 1: 手動入力テスト

#### 1.1 フィッシング攻撃テスト
```bash
# ホモグラフ攻撃
入力: https://аmazon.com/login
期待: High リスク「Unicode偽装文字」

# タイポスクワッティング  
入力: https://g00gle.com/search
期待: High リスク「タイポスクワッティング」

# フィッシングドメイン
入力: https://login-amazon.secure-verification.com
期待: Medium リスク「フィッシングキーワード」
```

#### 1.2 技術的脅威テスト
```bash
# 危険なスキーム
入力: javascript:alert('XSS')
期待: High リスク「危険なスキーム」

# IPアドレス直接指定
入力: http://192.168.1.1/admin  
期待: Medium リスク「HTTP+IPアドレス」

# 実行ファイル
入力: https://download.com/malware.exe
期待: High リスク「実行ファイルDL」
```

#### 1.3 難読化検出テスト
```bash
# Base64難読化
入力: https://example.com/path?data=aHR0cDovL2V2aWwuY29tL21hbHdhcmUuZXhl
期待: Medium リスク「Base64難読化」+ デコード結果表示

# 短縮URL
入力: https://bit.ly/3xY9Abc
期待: Medium リスク「短縮URL」

# 過剰なHexエンコード
入力: https://example.com/%65%78%65%63%75%74%65%2E%65%78%65
期待: Low リスク「Hexエンコード」
```

### Phase 2: QRコードスキャンテスト

#### 2.1 カメラ機能テスト
```bash
# 1. QRスキャナータブを開く
# 2. 「カメラ開始」をクリック
# 3. ブラウザーの許可ダイアログで「許可」
# 4. test-qr-generator.html で生成したQRコードをカメラにかざす
# 5. 自動デコード・解析を確認
```

#### 2.2 画像アップロードテスト
```bash
# 1. test-qr-generator.html でQRコード生成
# 2. 右クリック「画像を保存」でPNG保存
# 3. QRスキャナータブで「画像を選択」
# 4. 保存したPNGファイルを選択
# 5. デコード・解析結果を確認
```

### Phase 3: ホワイトリスト機能テスト

#### 3.1 ホワイトリスト登録
```bash
# 1. 「信頼できるドメイン」セクションで「example.com」を追加
# 2. テスト入力: https://example.com/test
# 3. 期待: 警告抑制確認

# 4. サブドメインテスト: https://sub.example.com/page
# 5. 期待: 同様に警告抑制
```

#### 3.2 ホワイトリスト削除
```bash
# 1. 登録したドメインの「×」ボタンをクリック
# 2. 再度同じURLをテスト
# 3. 期待: 警告が復活することを確認
```

### Phase 4: エッジケーステスト

#### 4.1 境界値テスト
```bash
# スコア境界値テスト（Medium/High境界: 5/6）
入力: http://example.com:8080/file.exe?redirect=evil.com
期待: 各要素のスコア合計で境界値確認

# 長さ境界値テスト
入力: https://test.com/[194文字の文字列]  # 200文字未満
期待: 長さ警告なし

入力: https://test.com/[196文字の文字列]  # 200文字超
期待: 長さ警告あり
```

#### 4.2 複合攻撃テスト
```bash
# 超高リスク複合
入力: javascript:window.location='http://192.168.1.1:8080/malware.exe'
期待: High リスク、複数の脅威検出

# フィッシング複合
入力: http://аmazon-security.tk/login?redirect=http://evil.com
期待: High リスク、Unicode+TLD+リダイレクト検出
```

### Phase 5: パフォーマンステスト

#### 5.1 大量データテスト
```bash
# 1. TEST_CASES.md の全URLを順次テスト
# 2. 応答時間を測定（通常 < 100ms）
# 3. メモリ使用量監視（開発者ツール）
```

#### 5.2 連続実行テスト
```bash
# 1. 同一URLを100回連続実行
# 2. 結果の一貫性確認
# 3. パフォーマンス劣化がないことを確認
```

## 🔍 自動テストスクリプト

### ブラウザーコンソール用テストスクリプト
```javascript
// 基本機能テスト
function runBasicTests() {
    const testCases = [
        {url: "javascript:alert('test')", expectedLevel: "High", expectedRules: ["scheme-danger"]},
        {url: "https://аmazon.com/login", expectedLevel: "High", expectedRules: ["spoofed-unicode"]},
        {url: "http://192.168.1.1/admin", expectedLevel: "Medium", expectedRules: ["scheme-http", "ip-host"]},
        {url: "https://bit.ly/test", expectedLevel: "Medium", expectedRules: ["shortener"]},
        {url: "https://example.com:8080/", expectedLevel: "Low", expectedRules: ["weird-port"]},
        {url: "https://www.google.com/", expectedLevel: "Low", expectedRules: []}
    ];

    console.log("🧪 QR Risk Radar 自動テスト開始");
    console.log("=====================================");

    let passCount = 0;
    let failCount = 0;

    testCases.forEach((testCase, index) => {
        console.log(`\nテスト ${index + 1}: ${testCase.url}`);
        
        try {
            const result = analysePayload(testCase.url);
            const actualLevel = result.level;
            const actualRules = result.details.map(d => d.rule);

            // リスクレベルチェック
            const levelMatch = actualLevel === testCase.expectedLevel;
            
            // ルールチェック（期待されるルールが全て含まれているか）
            const rulesMatch = testCase.expectedRules.every(rule => 
                actualRules.includes(rule)
            );

            if (levelMatch && rulesMatch) {
                console.log(`✅ PASS: レベル=${actualLevel}, ルール=[${actualRules.join(', ')}]`);
                passCount++;
            } else {
                console.log(`❌ FAIL: 期待レベル=${testCase.expectedLevel}, 実際=${actualLevel}`);
                console.log(`   期待ルール=[${testCase.expectedRules.join(', ')}]`);
                console.log(`   実際ルール=[${actualRules.join(', ')}]`);
                failCount++;
            }
        } catch (error) {
            console.log(`💥 ERROR: ${error.message}`);
            failCount++;
        }
    });

    console.log("\n=====================================");
    console.log(`📊 テスト結果: ${passCount} 成功, ${failCount} 失敗`);
    console.log(`成功率: ${((passCount / testCases.length) * 100).toFixed(1)}%`);
    
    return {pass: passCount, fail: failCount, total: testCases.length};
}

// テスト実行
runBasicTests();
```

### パフォーマンス測定スクリプト
```javascript
// パフォーマンステスト
function runPerformanceTest() {
    const testUrl = "https://example.com/test";
    const iterations = 1000;
    
    console.log(`🚀 パフォーマンステスト開始 (${iterations}回実行)`);
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
        analysePayload(testUrl);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    
    console.log(`⏱️  総実行時間: ${totalTime.toFixed(2)}ms`);
    console.log(`📊 平均実行時間: ${avgTime.toFixed(3)}ms`);
    console.log(`🔥 1秒間の処理可能回数: ${(1000 / avgTime).toFixed(0)}回`);
}

// 実行
runPerformanceTest();
```

## 📋 テストチェックリスト

### 基本機能 ✅
- [ ] 手動入力での URL/テキスト解析
- [ ] QRコードカメラスキャン
- [ ] QRコード画像アップロード
- [ ] リスクレベル分類（Low/Medium/High）
- [ ] 検出ルール表示
- [ ] ホワイトリスト登録・削除

### フィッシング検出 ✅
- [ ] ホモグラフ攻撃（Unicode偽装）
- [ ] タイポスクワッティング
- [ ] フィッシングドメイン
- [ ] 疑わしいTLD

### 技術的脅威検出 ✅
- [ ] 危険なスキーム（javascript:, data:等）
- [ ] IPアドレス直接指定
- [ ] 実行ファイルダウンロード
- [ ] 非標準ポート使用

### 難読化検出 ✅
- [ ] Base64エンコード（自動デコード）
- [ ] 短縮URL
- [ ] Hexエンコード過剰使用
- [ ] オープンリダイレクト

### エッジケース ✅
- [ ] 境界値スコア
- [ ] 空文字列入力
- [ ] 極端に長いURL
- [ ] 特殊文字を含むURL
- [ ] 複合攻撃パターン

### パフォーマンス ✅
- [ ] 応答時間 < 100ms
- [ ] 大量データ処理
- [ ] メモリリーク防止
- [ ] ブラウザー互換性

### セキュリティ ✅
- [ ] XSS脆弱性防止
- [ ] HTMLエスケープ
- [ ] 入力値検証
- [ ] CSP準拠

## 🐛 既知の問題と対策

### 問題1: QRスキャナーライブラリの読み込み失敗
**症状**: 「QRスキャンライブラリの読み込みに失敗しました」
**対策**: CDNからの読み込み確認、フォールバック実装

### 問題2: カメラアクセス許可
**症状**: カメラが起動しない
**対策**: HTTPS環境での実行、ブラウザー設定確認

### 問題3: 特殊文字の表示問題
**症状**: Unicode文字が正しく表示されない
**対策**: UTF-8エンコード確認、フォント設定

## 📈 テスト結果レポート

### 実行例
```
🧪 QR Risk Radar テスト実行レポート
実行日時: 2024-XX-XX XX:XX:XX
ブラウザー: Chrome 120.0.0.0
=====================================

基本機能テスト: 18/18 PASS (100%)
フィッシング検出: 25/25 PASS (100%)
技術的脅威検出: 20/20 PASS (100%)
難読化検出: 15/15 PASS (100%)
エッジケース: 12/12 PASS (100%)

総合結果: 90/90 PASS (100%)
平均実行時間: 23.5ms
```

## 🔧 トラブルシューティング

### よくある問題
1. **QRコードが読み取れない**: 画質確認、ライブラリバージョン確認
2. **誤検知が多い**: ホワイトリスト活用、ルール調整
3. **処理が遅い**: ブラウザー最適化、並列処理確認

### デバッグ方法
```javascript
// デバッグモード有効化
window.DEBUG_MODE = true;

// 詳細ログ表示
console.log(analysePayload("テストURL"));
```

このテストガイドにより、QR Risk Radarの全機能を体系的に検証できます。