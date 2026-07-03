import { Ctx } from "../utils/Functions/Ctx"
import { DigitalInputReader } from "../utils/Input/DigitalInput"
import { vec, Vec2 } from "../utils/Vec"
import { Edge } from "./Edge.js"

// player.js を忠実に再現した自機(点)
export class Player {
    p: Vec2
    v: Vec2 = vec(0, 0)
    g: Vec2 = vec(0, 0.4)

    // 床に触れているか?(直近6フレームぶんのバッファ。ジャンプ入力猶予)
    private onFloor: boolean[] = []

    private rotation = 0

    // ジャンプ上昇中（ボタン離しによる減衰が有効な状態）かどうかのフラグ
    private isJumping: boolean = false

    constructor(start: Vec2) {
        this.p = start
    }

    // メインループ(重力・移動の更新)
    update(): void {
        this.onFloor = this.onFloor.slice(-6)

        this.v = this.v.add(this.g)
        this.p = this.p.add(this.v)

        // 空気抵抗
        this.v = this.v.mul(0.99)

        this.rotation += this.v.dot(this.g.normal()) / 36

        this.onFloor.push(false)
    }

    // 入力
    move(input: DigitalInputReader<"left" | "right" | "jump">): void {
        if (input.isPressed("right")) {
            this.v = this.v.add(this.g.normal().mul(0.3))
        }
        if (input.isPressed("left")) {
            this.v = this.v.add(this.g.normal().mul(-0.3))
        }

        if (input.isPressed("jump")) {
            if (this.onFloor.includes(true)) {
                // 初速（大ジャンプの高さ）
                this.v = this.v.add(this.g.normalized().mul(-48 * 0.3))
                this.onFloor = []
                this.isJumping = true // ジャンプ開始
            }
        } else {
            // ボタンを離した時、かつジャンプ上昇中（速度ベクトルが重力と逆方向）の場合
            if (this.isJumping && this.v.dot(this.g) < 0) {
                const gDir = this.g.normalized()

                // 速度ベクトルを「重力方向(上下)」と「それ以外(左右)」に分解
                const vUp = gDir.mul(this.v.dot(gDir))
                const vHorizontal = this.v.sub(vUp)

                // 上昇速度のみを減衰させる（0.5の値を小さくすると小ジャンプがより低くなります）
                this.v = vHorizontal.add(vUp.mul(0.5))
            }
            // 減衰処理は1回のジャンプにつき1度だけ行うため、フラグを折る
            this.isJumping = false
        }
    }

    // 床との衝突判定(floor.js の F を1つ渡す。左側からのみ当たる)
    touchWith(floor: Edge): void {
        const f = this.getArrow()

        const p = floor.getIntersectionPoint(f)
        if (!p) return

        // 床がどれだけ垂直か(重力方向に対して)
        const verticality = floor.vec().normalized().cross(this.g.normalized())

        if (verticality >= 0.2 && floor.jumpable) {
            this.onFloor.push(true)
        }

        // 垂直抗力
        const normal = floor.vec().normal()

        this.v = this.v.sub(normal.mul(this.v.dot(normal) - 1))

        this.p = p
    }

    // 現在位置を中心に -v 〜 +v まで伸ばした自機の軌跡(スイープ用線分)
    private getArrow(): Edge {
        const start = this.p.add(this.v.mul(-1))
        const end = this.p.add(this.v)
        return new Edge(start.x, start.y, end.x, end.y)
    }

    draw(ctx: CanvasRenderingContext2D): void {
        Ctx.polygon(ctx, 8, 2, this.p.l, 32, "#111", { theta: this.rotation, lineWidth: 0.5 })
        Ctx.arc(ctx, this.p.l, 12, "#111", { lineWidth: 0.5 })
        Ctx.text(ctx, this.p.l, "#111", "罪", {
            align: "center",
            baseline: "middle",
            fontSize: 0.5,
            fontFamily: "serif",
        })
    }
}
