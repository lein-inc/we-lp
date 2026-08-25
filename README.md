# we-lp

株式会社We（wewewe.jp）LP プレビュー（パスワード保護付き静的サイト）。

## 公開URL

GitHub Pages: https://lein-inc.github.io/we-lp/

- パスワード: `we-lp-2026`

## 構成

- `src/index.html` — 編集用の原本（パスワード保護なし）
- `index.html` — staticrypt で暗号化済みの公開ファイル
- `css/style.css`, `js/main.js`, `img/` — 共通アセット（root配下、両方から参照）
- `.staticrypt.json` — staticrypt の設定（salt）
- `.github/workflows/pages.yml` — GitHub Pages デプロイワークフロー

## 再ビルド

```bash
# src/index.html を編集した後、以下を実行して index.html を再暗号化
npx staticrypt src/index.html -p 'we-lp-2026' --short -d .

# 日本語ラベル差替（title / staticrypt-title / placeholder / button value）を再適用
# 詳細は本リポジトリの index.html 参照
```

## パスワード変更

```bash
rm .staticrypt.json
npx staticrypt src/index.html -p '<新パスワード>' --short -d .
# 日本語ラベル差替を再適用
```
