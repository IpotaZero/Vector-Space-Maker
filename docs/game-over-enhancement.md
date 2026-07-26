# Player死亡演出のリッチ化 設計メモ

> このファイルは「別スレッドのClaude」向けの引き継ぎメモです。
> 依頼内容: 「Playerのlifeが0以下になった時、現状は別ページに移るだけなので、もっとリッチな演出にしたい」

## 現状の処理フロー（コード上の事実）

1. `src/Game/Game.ts` の `update()` 末尾で、毎フレーム以下をチェックしている。
   ```ts
   if (this.player.life <= 0) {
       this.onGameOver()
   }
   ```
   **ガードが無いため、life<=0 の間は毎フレーム `onGameOver()` が呼ばれ続ける。**
2. `onGameOver` は `src/Scene/SceneGame.ts` の `start()` 内で
   `new Game(..., () => { this.pages.enter("gameover") })` として渡している。
3. `this.pages.enter("gameover")` は `@ipota/pages` の layer 切り替え機能で、
   `assets/pages/game/index.html` 内の `#gameover` という静的な `div` を
   即座に表示するだけ（アニメーションなし、演出なし）。

## 参考実装: Enemyの死亡演出は既にリッチ

`src/Game/Actor/Enemy.ts` の `onDead()` が、まさに「敵が死んだ時のリッチな演出」の
実装例になっている。Playerの死亡演出もこれをベースに作るのが自然。

```ts
*onDead(): Generator {
    this.dispose()
    yield* remodel(this)
        .type("effect")
        .alpha(0.5)
        .p(this.p.clone())
        .duplicate(63, (me, i) => {
            me.radian = Math.random() * T
            me.speed = Math.random() * 4 + 4
            return me
        })
        .g(function* (me) {
            const frame = 60
            for (let i = 1; i < frame + 1; i++) {
                me.alpha = 0.5 * (1 - i / frame)
                yield
            }
            me.life = 0
        })
        .fire(this.game.bullets)
}
```

`Remodel`（`src/Game/Remodel.ts`）を使うと「弾（Bulletクラスを流用したパーティクル）」を
好きな数だけ複製し、ジェネレータで挙動を書ける。破片が飛び散るような表現に向いている。

`Game.ts`の`hitStopShot`/`hitStopSlash`（カメラシェイク+スローモーション）も
死亡演出の「タメ」として流用できる。

## 修正方針（3つの層に分けて考える）

### A. ゲームロジック層: 「死亡シーケンス」を作る
今は「life<=0を検知した瞬間に即ページ遷移」だが、これを
「死亡が確定→演出を数十フレーム再生→演出が終わったらページ遷移」という
一連の生成器(Generator)フローに変える。

### B. カメラ/エフェクト層: 既存の演出パーツを死亡時に流用する
`Camera.shake()` / `Camera.scaleTo()` / `looper.setFPS()`（スローモーション）/
`remodel(...).type("effect")`（パーティクル散乱）は既に他の場面で実装済みなので
新規実装ではなく「呼び出し方を追加する」だけで済む。

### C. UI層: `#gameover` ページ自体の見せ方をCSSでリッチにする
今は`display:flex`で即表示されるだけ。フェードイン/スケールイン/
文字送りなどのCSSアニメーションを追加する余地がある。

## 具体的な変更箇所

### 1. `src/Game/Actor/Player.ts`
- `isDead: boolean = false` を追加。
- Enemyの`onDead()`を参考に `*onDeadG(): Generator` を追加する。
  - `this.playable = false` で操作を止める（既存フィールドを流用）。
  - 可能なら `gltfViewer.playOnce("down")` 等（hare.glbに該当アニメーションが
    無ければ、アルファフェードや回転で代替する）。
  - `remodel(this).type("effect").duplicate(N, ...).g(...).fire(this.game.bullets)`
    でパーティクルを散らす（Enemyの実装をほぼ流用可）。
  - 数十フレーム待ってから終了する（`gltfViewer.dispose()`はここでは呼ばない。
    シーン破棄は`SceneGame.end()`側に任せる）。

### 2. `src/Game/Game.ts`
- `update()` 内の即時呼び出しをやめ、`isDead`のガードを追加する。
  ```ts
  if (this.player.life <= 0 && !this.player.isDead) {
      this.player.isDead = true
      this.camera.shake(10)
      this.addScript(() => this.playerDeathSequence())
  }
  ```
- `playerDeathSequence()` のようなプライベート生成器を用意し、
  「スローモーション化→パーティクル→数十フレーム待機→`this.onGameOver()`」の
  順で実行する。
- 死亡演出中は敵弾によるさらなるダメージ処理や`restartIfOutOfBounds()`が
  誤発火しないよう、`isDead`中はそれらの分岐をスキップするガードを入れる。

### 3. `src/se.ts`
- 現状のSEは `jump` / `doubleJump` / `land` のみ（`assets/se/`にも死亡音は無い）。
- 死亡演出用のSE（例: `death`）を追加する場合は、
  1. `assets/se/`に音源ファイルを追加（要ユーザー用意 or 既存素材の流用）
  2. `se.ts`の`static load()`に読み込み処理を追加
  3. `Player.onDeadG()`内で`se.death.play()`を呼ぶ
  という3ステップが必要。音源が無ければ一旦スキップしてもよい。

### 4. `assets/pages/game/index.css` / `index.html`
- `#gameover .kakomi` にフェードイン+スケールインの`@keyframes`を追加。
- 見出し`<h2>GameOver</h2>`の出現を少し遅らせる、赤系のビネット演出を
  疑似要素で追加、などで「即表示」感を減らせる。
- ボタンの表示を少し遅延させる（`animation-delay`）と、演出が終わってから
  操作可能になる印象を与えられる。

## 注意点（既存コードとの整合性）
- `Player.dispose()`は`gltfViewer.dispose()`を呼ぶ。死亡演出の途中で
  誤って呼ばないこと（呼ぶと3Dモデルが消えて演出が破綻する）。
  `SceneGame.end()`から呼ばれる通常のシーン破棄タイミングでのみ実行されるよう
  現状維持でよい。
- `restartIfOutOfBounds()`（ステージ外に落ちたら`reset()`）が死亡シーケンスと
  競合しないよう、`isDead`中はスキップする。
- 敵弾との再衝突で演出が二重起動しないよう、`isDead`フラグでガードする
  （`updateBulletAndEnemy()`内のダメージ処理も`isDead`中はスキップ推奨）。

## まとめ
- 変更が要る主なファイル: `Player.ts`, `Game.ts`, （任意で）`se.ts`,
  `assets/pages/game/index.html`, `assets/pages/game/index.css`
- 新規追加が要る素材: 死亡演出用SE（任意）、死亡モーション用GLTFアニメーション（任意、無ければ代替演出でOK）
- 既存の`Enemy.onDead()` / `Camera.shake()` / `Camera.scaleTo()` / `looper.setFPS()`が
  そのまま流用できるため、実装コスト自体は大きくない見込み。
