import { Ctx } from "../../utils/Functions/Ctx"
import { DigitalInput } from "@ipota/input"
import { vec, Vec } from "@ipota/vec"
import { Edge } from "../movable/Edge"
import { Actor } from "./Actor"
import { T } from "../../T"
import { remodel } from "../Remodel"
import { GameLike } from "../Game"

const SKIN = 0.01 // 数値誤差対策のごく小さい押し戻し量
const MAX_SLIDE_ITER = 4 // 1フレームあたりの最大スライド回数
const SPEED = 4
const JUMP = 48 * 0.3

export class Player extends Actor {
    v: Vec = vec(0, 0)
    g: Vec = vec(0, 0.7)

    private onFloor: boolean[] = []
    private rotation = 0
    private isJumping = false
    private canDoubleJump = true // 2段ジャンプの権利

    private readonly maxLife = 100

    /**最後に入力した方向 */
    private direction = 1

    constructor(game: GameLike, start: Vec) {
        super(game)
        this.p = start
        this.life = 100

        this.addScript(this.attack.bind(this), { loop: Infinity })
    }

    update(): void {
        super.update()

        this.onFloor = this.onFloor.slice(-6)
        this.v = this.v.add(this.g) // 重力の加算
        this.rotation += this.v.dot(this.g.normal()) / 36
        this.onFloor.push(false)

        // 重力方向の単位ベクトル
        const gDir = this.g.normalize()
        // 垂直方向と水平方向の速度成分に分解
        const vUp = gDir.scale(this.v.dot(gDir))
        const vHorizontal = this.v.sub(vUp)

        // 水平方向にのみ強い摩擦（例えば0.7など）をかける
        // ※onFloor配列を使って空中と地上の摩擦を変えるのも効果的です
        const newVHorizontal = vHorizontal.scale(0.7)

        // 垂直方向には軽い空気抵抗（終端速度の調整用）をかけるか、そのままにする
        const newVUp = vUp.scale(0.99)

        // 再合成
        this.v = newVHorizontal.add(newVUp)
    }

    move(input: DigitalInput.Reader<"left" | "right" | "jump">): void {
        if (input.isPressed("right")) {
            this.v = this.v.add(this.g.normal().scale(SPEED))
            this.direction = 1
        }
        if (input.isPressed("left")) {
            this.v = this.v.add(this.g.normal().scale(-SPEED))
            this.direction = -1
        }

        if (input.isPressed("jump")) {
            if (this.onFloor.includes(true)) {
                this.jump()
                this.onFloor = []
            } else if (this.canDoubleJump && !this.isJumping) {
                this.jump()
                this.canDoubleJump = false
            }
        } else {
            // ジャンプキャンセル（小ジャンプ）の計算を簡略化
            if (this.isJumping && this.v.dot(this.g) < 0) {
                const vUp = this.g.normalize().scale(this.v.dot(this.g.normalize()))
                this.v = this.v.sub(vUp.scale(0.5))
            }
            this.isJumping = false
        }
    }

    private jump(): void {
        const gDir = this.g.normalize()
        // 現在の垂直速度を消去してからジャンプ力を加える（落下中の2段ジャンプ対策）
        this.v = this.v.sub(gDir.scale(this.v.dot(gDir))).add(gDir.scale(-JUMP))
        this.isJumping = true
    }

    /**
     * 現在の速度をもとに、衝突を解決しながら実際に this.p を進める。
     * 1フレーム内で複数回当たっても、常に「最も早い衝突」だけを採用し、
     * 残りの移動量でスライドを続けることで、引っかかりを防ぐ。
     */
    resolveCollisions(floors: Edge[]): void {
        let start = this.p
        let remaining = this.v // このフレームで進むべき残り移動量

        for (let i = 0; i < MAX_SLIDE_ITER; i++) {
            const end = start.add(remaining)

            let closest: { t: number; point: Vec; floor: Edge } | null = null

            // 最も早く衝突する床を探す
            for (const floor of floors) {
                // 【変更】床の移動量(dp)を考慮し、相対的な移動開始位置を計算して判定する
                const relStart = start.add(floor.dp)
                const hit = floor.getSweepHit(relStart, end)
                if (!hit) continue
                if (!closest || hit.t < closest.t) {
                    closest = { ...hit, floor }
                }
            }

            // 衝突がなければ残り移動量をそのまま適用して終了
            if (!closest) {
                start = end
                break
            }

            const { point, floor } = closest
            const normal = floor.vec().normal() // 常にEdgeの左側（表側）を向く法線

            // 移動開始地点がEdgeの右側(裏側)だったか判定
            // (法線は左側を向いているため、内積が負なら右側にいたことになる)
            const q = start.sub(floor.start)
            const isFromRightSide = q.dot(normal) < 0

            // 床判定
            const verticality = floor.vec().normalize().cross(this.g.normalize())
            if (verticality >= 0.2) {
                this.onFloor.push(true)
                this.canDoubleJump = true // 着地時に2段ジャンプを回復
            }

            // 速度成分の打ち消し（速度を殺す）
            const vn = this.v.dot(normal)
            // 左からの衝突(vn < 0)、または右からのすり抜け吸着(isFromRightSide && vn > 0)の場合
            if (vn < 0 || (isFromRightSide && vn > 0)) {
                this.v = this.v.sub(normal.scale(vn))
            }

            // 残り移動量からも成分を除去(スライド または 吸着)
            // ※元コードの斜め衝突時のバグを修正するため、残りの移動量(unconsumed)を基に再計算しています
            const unconsumed = end.sub(point)
            const un = unconsumed.dot(normal)
            if (un < 0 || (isFromRightSide && un > 0)) {
                remaining = unconsumed.sub(normal.scale(un))
            } else {
                remaining = unconsumed
            }

            // 常にEdgeの左側(表側)へSKIN分押し戻す
            // 左からぶつかった場合は「めり込み防止」として機能し、
            // 右から接触した場合は「すり抜けた直後に表側に吸着」として機能する
            start = point.add(normal.scale(SKIN))
        }

        this.p = start
    }

    draw(ctx: CanvasRenderingContext2D): void {
        Ctx.polygon(ctx, 8, 2, this.p.l, 24, "#111", { theta: this.rotation / 2, lineWidth: 0.5 })
        Ctx.arc(ctx, this.p.l, 8, "#111", { lineWidth: 0.5 })
        Ctx.text(ctx, this.p.l, "#111", "罪", {
            align: "center",
            baseline: "middle",
            fontSize: 0.5,
            fontFamily: "serif",
        })

        const w = this.game.width / 4

        Ctx.rect(ctx, [64, 64], [w, 32], "black", { lineWidth: 1 })
        Ctx.rect(ctx, [64 + w * (1 - this.life / this.maxLife), 64], [w * (this.life / this.maxLife), 32], "gray", {
            lineWidth: 0,
        })
    }

    hitSlash() {
        if (!this.onFloor.includes(true)) {
            this.v = this.v.add(this.g.scale(-10))
        }
    }

    private *attack() {
        // 遠距離
        if (this.game.input.isPushed("fire")) {
            yield* remodel(this)
                .p(this.p)
                .type("friend")
                .radian(this.g.radian() + (-T / 4) * this.direction)
                .speed(28)
                .fire(this.game.bullets)
        }

        // 近距離(15frame)
        if (this.game.input.isPushed("slash")) {
            yield* remodel(this)
                .damage(5)
                .p(this.p.add(this.g.normal().scale(this.direction * 12)))
                .type("friend")
                .speed(0)
                .r(this.r * 6)
                .g(function* (me) {
                    for (let i = 0; i < 15; i++) {
                        me.p = this.p.add(this.g.normal().scale(this.direction * 12))
                        yield
                    }
                    me.life = 0
                })
                .fire(this.game.bullets)
        }
        yield
    }
}
