import { Vec2, vec } from "../utils/Vec.js"

// 継ぎ目のすり抜け対策: 線分自身の ratio 判定に持たせる余裕(px換算)
const COLLISION_MARGIN = 0

/**
 * jumpable は「乗ったときにジャンプ可能な床として扱うか」だけを表す。
 */
export class Edge {
    readonly start: Vec2
    readonly end: Vec2
    readonly jumpable: boolean

    constructor(x0: number, y0: number, x1: number, y1: number, jumpable = true) {
        this.start = vec(x0, y0)
        this.end = vec(x1, y1)
        this.jumpable = jumpable
    }

    vec(): Vec2 {
        return this.end.sub(this.start)
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = "#111"
        ctx.lineWidth = 1

        if (this.jumpable) ctx.setLineDash([5, 0])
        else ctx.setLineDash([5, 5])

        ctx.beginPath()
        ctx.moveTo(this.start.x, this.start.y)
        ctx.lineTo(this.end.x, this.end.y)
        ctx.stroke()

        const dir = this.end.sub(this.start).normalized()
        const end0 = this.end.add(dir.rotate((Math.PI * 4) / 5).mul(24))
        const end1 = this.end.add(dir.rotate((-Math.PI * 4) / 5).mul(24))

        ctx.beginPath()
        ctx.moveTo(this.end.x, this.end.y)
        ctx.lineTo(end0.x, end0.y)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(this.end.x, this.end.y)
        ctx.lineTo(end1.x, end1.y)
        ctx.stroke()

        ctx.setLineDash([])
    }

    getIntersectionPoint(other: Edge): Vec2 | null {
        const x0 = this.start.x
        const y0 = this.start.y
        let x1 = this.end.x
        const y1 = this.end.y

        const x2 = other.start.x
        const y2 = other.start.y
        let x3 = other.end.x
        const y3 = other.end.y

        if (Math.abs(x1 - x0) < 0.01) x1 = x0 + 0.01
        if (Math.abs(x3 - x2) < 0.01) x3 = x2 + 0.01

        const t0 = (y1 - y0) / (x1 - x0)
        const t1 = (y3 - y2) / (x3 - x2)

        // 平行ならば
        if (t0 === t1) return null

        const x = (y2 - y0 + t0 * x0 - t1 * x2) / (t0 - t1)
        const y = t0 * (x - x0) + y0

        // 線分として当たっているか?(この線分側だけ端点付近に余裕を持たせる)
        const ratio0 = (x - x0) / (x1 - x0)
        const ratio1 = (x - x2) / (x3 - x2)

        const eps = COLLISION_MARGIN / this.vec().magnitude()
        const isHit = ratio0 > -eps && ratio0 < 1 + eps && ratio1 > 0 && ratio1 < 1

        if (!isHit) return null

        return vec(x, y)
    }
}

export const edge = (x0: number, y0: number, x1: number, y1: number, jumpable = true): Edge =>
    new Edge(x0, y0, x1, y1, jumpable)
