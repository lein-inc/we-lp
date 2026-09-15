# we-lp

株式会社We（wewewe.jp）LP プレビュー（パスワード保護付き静的サイト）。

## 公開URL

GitHub Pages: https://lein-inc.github.io/we-lp/

- パスワード: `we-lp-2026`

## 構成

**B案（ヒーロー黒）で一本化済み（2026-09-10 MTGで採用決定。旧A案=白/C案=グラデは廃止）**

- `src/index.html` — 編集用の原本（B案：`<body class="hero-dark">` + `css/hero-dark.css`、パスワード保護なし）
- `index.html` — staticrypt で暗号化済みの公開ファイル
- `css/style.css`, `css/hero-dark.css`, `js/main.js`, `img/` — アセット（root配下）
- `.staticrypt.json` — staticrypt の設定（salt）
- `.github/workflows/pages.yml` — GitHub Pages デプロイワークフロー

## 再ビルド

```bash
# src/index.html を編集した後、以下を実行して index.html を再暗号化
npx staticrypt src/index.html -p 'we-lp-2026' --short -d .

# ⚠️ 生成された index.html は素のstaticrypt UI。カスタムログイン画面（白背景+黒ボタン+
# 赤丸マーカー+日本語ラベル）を維持するには、「旧 index.html の staticryptConfig = {...}
# の行だけを新しい値に差し替える」方式が確実（旧HTMLを保持し config 行のみ更新）。
```

## パスワード変更

```bash
rm .staticrypt.json
npx staticrypt src/index.html -p '<新パスワード>' --short -d .
# 上記のログイン画面カスタム維持手順を再適用
```
