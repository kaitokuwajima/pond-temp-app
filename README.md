# 🐟 池温よそく - 釣り人のための水温予測アプリ

地図をタップするだけで、池の水温を科学的に予測するWebアプリです。

## 機能

- 🗺 **地図タップで池選択** - Leaflet (OpenStreetMap) で地図をタップ
- 📐 **池の自動検出** - Overpass API で水域ポリゴンを取得、面積を自動計算
- 📏 **水深推定** - 面積から統計的回帰モデル (Cael & Seekell, 2016) で推定
- 🌡 **水温予測** - 熱収支方程式 (Edinger et al., 1968) で計算
- 🔬 **科学的根拠** - なぜその水温になるか、計算過程を日本語で解説
- 🎣 **釣果記録** - 魚種・サイズ・ルアーを記録（localStorage保存）
- ⭐ **お気に入り池** - よく行く池をワンタップ保存

## 使用API（全て無料）

| API | 用途 | 料金 |
|-----|------|------|
| Overpass API (OSM) | 池ポリゴン検出 | 無料 |
| Open-Meteo | 気象データ | 無料 |
| Nominatim (OSM) | 地名検索 | 無料 |
| Leaflet + OSM Tiles | 地図表示 | 無料 |

## デプロイ手順（Vercel）

### 1. GitHubリポジトリ作成

```bash
cd pond-temp-app
git init
git add .
git commit -m "初回コミット: 池温よそく v1.1"
gh repo create pond-temp-app --public --push
```

### 2. Vercelでデプロイ

1. [vercel.com](https://vercel.com) にログイン
2. 「Add New Project」をクリック
3. GitHubリポジトリ「pond-temp-app」を選択
4. Framework Preset: **Next.js** が自動検出される
5. 「Deploy」ボタンを押す
6. 約1分で完了！URLが発行される

### 3. 完了！

`https://pond-temp-app.vercel.app` のようなURLでアクセスできます。

## ローカル開発

```bash
npm install
npm run dev
# http://localhost:3000 でアクセス
```

## 技術スタック

- Next.js 14 (App Router)
- React 18
- Leaflet (地図)
- Overpass API (池検出)
- Open-Meteo API (気象データ)
- 熱収支モデル (水温推定)

## ライセンス

MIT
