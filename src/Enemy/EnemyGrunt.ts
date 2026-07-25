import { vec } from "@ipota/vec"
import { Enemy } from "../Game/Actor/Enemy"
import { GameLike } from "../Game/Game"
import { remodel } from "../Game/Remodel"

/**
 * 道中に配置する雑魚敵の一例。
 *
 * - 出現位置(home)を中心に、左右にゆっくり往復移動する
 * - 一定間隔でプレイヤー狙いの弾を1発だけ撃つ
 * - HPが低く、数発当てれば倒せる（ボス演出やセリフは無し）
 *
 * Tiledでの配置方法:
 *   1. オブジェクトの name を "Enemy" にする
 *   2. カスタムプロパティ "enemy" (string型なら "EnemyGrunt"、
 *      file型ならこのファイルを選択) を追加する
 *   3. 配置した座標がそのまま出現位置(this.p)になる
 */
export default class extends Enemy {
    constructor(game: GameLike) {
        super(game, 10, 32)

        // モデルはC8.glbを流用（専用モデルが用意できたら差し替える）
        this.gltfViewer.show("assets/3d/C8.glb", {
            scale: 0.5,
            p: [0, 0, -5],
            animationName: "fluttering",
        })

        this.addScript(this.patrol.bind(this), { loop: Infinity, id: "patrol" })
        this.addScript(this.attack.bind(this), { loop: Infinity, id: "attack" })
    }

    hit(): void {
        super.hit()
        this.gltfViewer.playOnce("damage")
    }

    /**
     * 出現位置を中心に左右へ往復する。
     *
     * 注意: home は generator が最初に実行される（=最初のupdate()）タイミングで
     * 評価される。コンストラクタの中で this.p.clone() すると、まだ
     * Game側がTiledの座標を代入する前の値(0,0)を捉えてしまうため、
     * 必ずこのように generator の中で captureする。
     */
    private *patrol() {
        const home = this.p.clone()
        const distance = 96
        const frame = 90

        while (true) {
            yield* this.moveTo(home.add(vec(distance, 0)), frame)
            yield* Array(30)
            yield* this.moveTo(home.add(vec(-distance, 0)), frame)
            yield* Array(30)
        }
    }

    /** 一定間隔でプレイヤー狙いの弾を1発撃つ */
    private *attack() {
        yield* Array(90)

        this.gltfViewer.playOnce("charge-short", { canOverride: false })
        yield* Array(20)

        yield* remodel(this).r(10).p(this.p.clone()).aim(this.game.player.p).fire(this.game.bullets)

        yield* Array(60)
    }
}
