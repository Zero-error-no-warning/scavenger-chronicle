# 拾荒者クロニクル / Scavenger Chronicle

終わった世界で、拾った道具と小さな移動拠点を頼りに生き延びる、探索・カード戦闘ゲーム。初期プレイ可能版 **0.1.0**。

## 遊べるもの

- 個人は徒歩、移動拠点は燃料で別々に移動する。拠点に戻り、資源や装備を保管する。
- 判断で探索箇所を発見、行動で探索回数、知覚で良い発見の確率、実効で発見の成否が変わる。
- 戦闘は双方の行動列を計画した後、一括解決。同じ位置のカードを同時扱いにする。
- 知覚＝公開する敵予定、判断＝手札枚数、行動＝実行するカード枚数、実効＝攻撃の６面ダイス数。
- 頭HP・体HP・頭ST・体ST。６の出目は頭に当たり、体HPが尽きるとダメージが頭へ流れる。
- １アイテムに１〜３個の修飾子がつく。各修飾子には利点と欠点があり、効果を合算する。
- 装備を反映するちびキャラ、敵３種、探索施設９種、カード９種、拠点設備５種。静的SVGのトゥーン風グラフィック。
- 食料・水・医療品、荷重、休息、設備追加、次の街への移動。
- 自動保存、JSONセーブの書き出し・読み込み。戦闘途中の手札・敵予定・乱数状態も保存する。
- PCの横長画面、スマホのフィールド／操作エリアの上下構成。スマホではHP・STを上部に表示し、戦闘の実行ボタンを下端に配置。

数値・カード効果・敵AIは初期調整段階。旧版の全機能を移植したものではなく、新しいゲームの土台です。詳細は [設計](docs/design.md) と [検証結果](docs/validation.md) を参照。

## ローカルで起動

Node.js 22以上。外部npm依存、CDN、バックエンドは不要。

```bash
npm run dev
```

http://localhost:4173 を開く。ES Modulesを使うので、HTMLファイルを直接ダブルクリックする `file://` 起動には対応しない。

```bash
npm test
npm run build
node scripts/serve.mjs --dist
```

`dist/` はゲームを動かす静的ファイルだけを含む。ソース、テスト、資料、旧プロトタイプは配信しない。すべてのアセット参照が相対パスなので `/scavenger-chronicle/` のようなPagesのサブパスで動作する。

## GitHub Pages

1. 公開リポジトリ `scavenger-chronicle` を作る。
2. このフォルダの中身を `main` に配置する。
3. **Settings → Pages → Build and deployment → Source → GitHub Actions** を選ぶ。
4. `main` へのpush、またはActionsの手動実行でテスト・ビルド・公開が走る。

公開先の想定URLは `https://Zero-error-no-warning.github.io/scavenger-chronicle/`。これは作成後の想定であり、この初版の準備時点ではリポジトリ作成・公開完了を確認していません。

GitHub公式資料：

- [カスタムワークフローでのPages公開](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Pagesの公開元設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 変更する場所

| 対象 | ファイル |
|---|---|
| 初期能力・カード・武器・防具・修飾子・設備・敵・場所 | `src/data.js` |
| 出目・ダメージ・敵AI・行動列・ラウンド処理 | `src/combat.js` |
| 修飾子合算と装備生成 | `src/items.js` |
| 探索・資源・拠点・休息・地図 | `src/world.js` |
| 主人公・装備・拠点・敵・背景のSVG | `src/art.js` |
| 画面と操作 | `src/main.js` |
| セーブと読み込みの検査 | `src/storage.js` |
| 表示とスマホレイアウト | `styles/game.css`, `styles/layout.css` |

元の添付ゲームは `legacy/prototype-v10.html` に保存。セーブの互換性は設けていない。ライセンスは未設定です。
