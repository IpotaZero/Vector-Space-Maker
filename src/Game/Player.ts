import { Ctx } from "../utils/Functions/Ctx"
import { DigitalInputReader } from "../utils/Input/DigitalInput"
import { vec, Vec2 } from "../utils/Vec"
import { Edge } from "./movable/Edge"

const SKIN = 0.01 // 数値誤差対策のごく小さい押し戻し量
const MAX_SLIDE_ITER = 4 // 1フレームあたりの最大スライド回数

export class Player {
    p: Vec2
    v: Vec2 = vec(0, 0)
    g: Vec2 = vec(0, 0.4)

    private onFloor: boolean[] = []
    private rotation = 0
    private isJumping = false

    constructor(start: Vec2) {
        this.p = start
    }

    update(): void {
        this.onFloor = this.onFloor.slice(-6)
        this.v = this.v.add(this.g)
        this.rotation += this.v.dot(this.g.normal()) / 36
        this.onFloor.push(false)
        // ここでは this.p を直接動かさない。目標位置は resolveCollisions で決める。

        this.v = this.v.mul(0.98) // 空気抵抗
    }

    move(input: DigitalInputReader<"left" | "right" | "jump">): void {
        if (input.isPressed("right")) {
            this.v = this.v.add(this.g.normal().mul(0.4))
        }
        if (input.isPressed("left")) {
            this.v = this.v.add(this.g.normal().mul(-0.4))
        }

        if (input.isPressed("jump")) {
            if (this.onFloor.includes(true)) {
                this.v = this.v.add(this.g.normalized().mul(-48 * 0.3))
                this.onFloor = []
                this.isJumping = true
            }
        } else {
            if (this.isJumping && this.v.dot(this.g) < 0) {
                const gDir = this.g.normalized()
                const vUp = gDir.mul(this.v.dot(gDir))
                const vHorizontal = this.v.sub(vUp)
                this.v = vHorizontal.add(vUp.mul(0.5))
            }
            this.isJumping = false
        }
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

            let closest: { t: number; point: Vec2; floor: Edge } | null = null

            // 最も早く衝突する床を探す
            for (const floor of floors) {
                const hit = floor.getSweepHit(start, end)
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
            const verticality = floor.vec().normalized().cross(this.g.normalized())
            if (verticality >= 0.2) {
                this.onFloor.push(true)
            }

            // 速度成分の打ち消し（速度を殺す）
            const vn = this.v.dot(normal)
            // 左からの衝突(vn < 0)、または右からのすり抜け吸着(isFromRightSide && vn > 0)の場合
            if (vn < 0 || (isFromRightSide && vn > 0)) {
                this.v = this.v.sub(normal.mul(vn))
            }

            // 残り移動量からも成分を除去(スライド または 吸着)
            // ※元コードの斜め衝突時のバグを修正するため、残りの移動量(unconsumed)を基に再計算しています
            const unconsumed = end.sub(point)
            const un = unconsumed.dot(normal)
            if (un < 0 || (isFromRightSide && un > 0)) {
                remaining = unconsumed.sub(normal.mul(un))
            } else {
                remaining = unconsumed
            }

            // 常にEdgeの左側(表側)へSKIN分押し戻す
            // 左からぶつかった場合は「めり込み防止」として機能し、
            // 右から接触した場合は「すり抜けた直後に表側に吸着」として機能する
            start = point.add(normal.mul(SKIN))
        }

        this.p = start
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
