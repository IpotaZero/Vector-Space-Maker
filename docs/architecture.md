# プロジェクト構造ドキュメント

> このファイルはコードベースを読み解いた結果をまとめたものです。
> 実装の詳細な設計判断（死亡演出など）は `docs/game-over-enhancement.md` を参照。

## 概要

- **ジャンル**: 重力操作型の2Dアクション（横スクロール＋弾幕/ボス戦要素あり）。
  仮タイトルは index.html より `The Vectorized Days! (Tentative)`。
- **技術スタック**:
  - TypeScript + Vite（ビルドツール）
  - 描画は基本 `CanvasRenderingContext2D`（2D）
  - キャラクターの立ち絵/一部演出のみ three.js (`GltfViewer`) でGLTFモデルを描画し、
    Canvas 2D の上にオーバーレイ合成している
  - マップは Tiled Map Editor で作成し (`@kayahr/tiled` 型定義を利用)、JSON(.tmj)を読み込む
  - `@ipota/*` という個人(?)スコープの自作npmパッケージ群に、入力・ページ遷移・
    ベクトル演算・BGM管理・汎用関数(イージング等)を切り出している

## ビルド・実行

- `package.json` の `scripts.build`: `npx vite build --watch`
  （出力先 `dist/module/main.js`。`vite.config.js` で three.js とその他ライブラリを
  チャンク分割している）
- エントリーポイントは `index.html` → `dist/module/main.js`（ビルド後の `src/main.ts`）
- `tsconfig.json`: `strict: true`, `rootDir: src`, ES Modules / Bundler解決

## ディレクトリ構成

```
src/
├── main.ts               # エントリーポイント。起動処理・グローバルなsc/focuses/input
├── Dom.ts                 # #container 要素の取得
├── input.ts                # キー/ゲームパッドの割り当て定義 (@ipota/input)
├── se.ts                   # 効果音(SE)のロードと再生
├── bm.ts                   # BGM管理 (@ipota/bgm-manager) のシングルトン
├── looper.ts               # メインループ(@ipota/my-utils Looper)のシングルトン
├── T.ts                    # 定数 T = 2π（角度計算の簡略化用）
│
├── Scene/                  # 画面単位の大きな状態（タイトル/ゲーム本編）
│   ├── SceneTitle.ts
│   └── SceneGame.ts
│
├── utils/
│   ├── Scene/Scene.ts, SceneChanger.ts   # Scene抽象クラスとフェード付き切り替え管理
│   ├── GltfViewer.ts       # three.jsでGLTFモデルを表示するオーバーレイCanvas
│   ├── TextBox.ts          # 会話ウィンドウ（ジェネレータで1行ずつ送る）
│   ├── Color.ts            # CSS色名の型定義
│   ├── NumberKeys.ts       # 「Tのプロパティのうちnumber型のキーだけ」を絞る型ユーティリティ
│   └── Functions/          # Ctx(Canvas描画ヘルパー), MathEx, isSmartPhone
│
├── Stage/                  # Tiledマップの読み込みとステージごとの固有スクリプト
│   ├── Stage.ts             # 抽象基底クラス（幅高さ/movables/開始位置/敵配置/setup）
│   ├── loadStageFromJson.ts # Tiled JSON(.tmj)をMovable/EnemySpawn群に変換
│   ├── StageTest.ts, StageTutorial.ts, Stage道中-0.ts  # 個別ステージ(Stageを継承)
│
├── Enemy/                  # 敵の具体的な実装（Tiledのプロパティ文字列から動的import）
│   ├── createEnemy.ts       # 名前文字列→クラスの解決(import.meta.glob)
│   ├── EnemyGrunt.ts        # 雑魚敵
│   └── EnemyTest.ts         # ボス敵（セリフ・複数フェーズあり）
│
└── Game/                   # ゲーム本編のロジック本体
    ├── Game.ts              # ゲームループの中心。Player/Enemy/Bullet/Cameraを統括
    ├── GameNode.ts          # ジェネレータベースのスクリプト実行基盤（後述）
    ├── Physics.ts           # 重力方向を考慮した衝突解決(Edgeとのスイープ判定)
    ├── BulletCollision.ts   # 弾の当たり判定(ball/line/arrow/laser)
    ├── BulletDrawer.ts      # 弾の見た目(donut/ball/line/arrow/laser)をCanvasに描画
    ├── Remodel.ts           # 弾を使った演出DSL（詳細後述）
    ├── Actor/
    │   ├── Actor.ts          # p, r, life を持つ基底クラス
    │   ├── Player.ts         # 自機。移動・ジャンプ・攻撃・被弾・死亡演出
    │   ├── Enemy.ts          # 敵の抽象基底クラス（HP・被弾演出・死亡演出）
    │   ├── Camera.ts         # 重力方向に応じて回転するカメラ、シェイク/ズーム演出
    │   └── Bullet.ts         # 弾(≒パーティクル)。Remodelから生成される
    └── movable/
        ├── Movable.ts        # 床/ゾーン等、joints+cycleで往復移動できる基底クラス
        ├── Edge.ts           # 床・壁の線分（当たり判定の対象）
        ├── TextObject.ts     # マップ上に置くテキスト表示
        └── zone/             # 触れると効果が起きる円形/矩形ゾーン群
            ├── Zone.ts        # 抽象基底(onEnter, contains)
            ├── GravityZone.ts # 重力の向き・強さを変える
            ├── ScaleZone.ts   # カメラのズーム率を変える
            └── GoalZone.ts    # ステージクリア(onFinish)を発火

assets/
├── 3d/     # GLTFモデル(hare.glb=Player, C8.glb=敵 等)
├── bgm/, se/  # 音源
├── fonts/
├── map/    # Tiledで作成したマップ(.tmj)
└── pages/  # @ipota/pages で読み込むHTML/CSSの画面部品(title, game=クリア/ポーズ/ゲームオーバー等)
```

## 起動〜画面遷移の流れ

1. `main.ts` の `DOMContentLoaded` で `se.load()`（効果音ロード）→ `looper.start()`
   （メインループ開始）→ `sc.goto(() => new SceneTitle())` で最初のシーンへ。
2. `sc`（`SceneChanger`）はシーン切り替え時に `Transition.fadeOut/fadeIn` で
   コンテナ全体をフェードさせつつ、旧シーンの `end()` → 新シーンの `start()` を呼ぶ。
   `looper.addHandler` に登録された関数が毎フレーム `sc.update()` を呼び、
   現在の `Scene.update()` を進行させる。
3. `Scene`（抽象クラス）を継承する具体クラスは現状2つ。
   - `SceneTitle`: タイトル画面。`@ipota/pages` でタイトル/ステージ選択画面を
     クロスフェード切り替えし、選んだステージ名から動的import(`import.meta.glob`)で
     `Stage*.ts` を解決 → `Stage.create()` でTiledマップを読み込み →
     `SceneGame` へ `sc.goto()`。
   - `SceneGame`: ゲーム本編。`assets/pages/game/index.html` を読み込み、
     `Game` インスタンスを生成して `#main` canvas に描画させる。
     `onFinish`(クリア)/`onGameOver`(死亡)のコールバックで
     `pages.enter("clear"|"gameover")` を呼び、ポーズ/リトライ/クリア/
     ゲームオーバーの各オーバーレイをPages(HTML layer)で出し分ける。

`Pages`(@ipota/pages) は「1つのHTMLファイル内に複数の`div.page`を用意し、
`data-link`属性のボタン等でそれらを切り替える」ための小さなSPAルーター的存在。
シーン(`SceneChanger`)がより大きな単位（タイトル⇔ゲーム本編）の切り替えで、
`Pages`はシーン内の小さなオーバーレイ（ポーズ画面等）の切り替え、という役割分担。

## Gameクラス（ゲーム本編の心臓部）

`Game.update()` が毎フレーム呼ばれ、大まかに以下の順で処理する。

1. Canvasクリア
2. `super.update()`（`GameNode`が持つscripts、`Stage.setup`等のジェネレータを進行）
3. `updateMovables()` — ステージ上のEdge/Zone/TextObjectを更新（往復移動等）
4. `handleZoneEnter()` — プレイヤーがZoneに重なっていたら`onEnter`を発火
5. `updateBulletAndEnemy()` — 弾と敵/プレイヤーの当たり判定、ダメージ処理、
   生存フィルタリング
6. `updatePlayer()` — 入力反映(`player.move`)とプレイヤー自身のupdate
7. `updateCamera()`
8. `restartIfOutOfBounds()` — ステージ外に落ちたら`reset()`で復帰
9. 描画(`draw()`)
10. `player.life <= 0` を検知したら死亡シーケンスを開始
    （`isDead`フラグで一度だけ。詳細は`docs/game-over-enhancement.md`参照）

## GameNode — ジェネレータベースのスクリプトシステム（最重要パターン）

`Actor`・`Movable`・`Game`自身などほぼ全てのゲームオブジェクトは
`GameNode`(`src/Game/GameNode.ts`)を継承している。このプロジェクト全体の
ロジックは「Generator関数を`addScript`で登録し、`update()`のたびに
`generator.next()`を1回呼んで1フレーム進める」という設計に貫かれている。

```ts
protected addScript(g: (me: this) => Generator, { loop = 1, margin = 0, id }): void
```

- `yield` 1回 = 1フレーム待つ、という意味になる（例: `yield* Array(30)`で30フレーム待機）。
- `loop: Infinity` を指定すると、ジェネレータが完了しても新しく呼び直して回し続ける
  （「常駐スクリプト」を作る定石）。
- `id` を指定すると、同じ役割のスクリプトを後から`removeScript(id)`で明示的に止められる
  （例: ボスのフェーズ切り替えで攻撃パターンの生成器を差し替える）。
- `sleep(frame)` を呼ぶと、そのGameNode全体のupdateが指定フレーム止まる
  （ノックバック等の演出で使用）。

この「ジェネレータ=時間軸を持ったスクリプト」というパターンにより、
敵の攻撃パターンやボスの会話進行、演出のタイミング調整が
コールバック地獄にならずに直列的に書けるようになっている
（`EnemyTest.ts`のボス戦シーケンスが好例）。

## Remodel — 弾/パーティクル生成のミニDSL

`src/Game/Remodel.ts` の `remodel(actor)` は、`Bullet`を1つ生成した状態から
始まる流れるようなAPI(fluent API)。`Bullet`のプロパティ名と同名のメソッド
（Proxyで動的生成）で値を設定でき、`duplicate(n, map)`で複製（nway弾等）、
`g(generatorFn)`で個々の弾の挙動を追加し、最後に`fire(bullets配列)`で
実際にゲーム内へ登場させる。

`Bullet.type` は `"friend" | "enemy" | "neutral" | "effect"` の4種類があり、
`"effect"` は当たり判定を持たない演出専用パーティクルとして使われる
（`Enemy.onDead()`の爆散演出など）。つまり「弾」「攻撃判定」「見た目だけの
パーティクル」を同じ`Bullet`クラスで表現する、コード共有重視の設計。
