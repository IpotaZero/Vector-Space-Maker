import { Vec2, vec } from "../utils/Vec.js"

const COLLISION_MARGIN = 0

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

    /**
     * このEdge(床/壁)と、sweepStart→sweepEnd の移動区間との交差判定。
     * cross積ベースなので垂直・水平を含めどんな向きでも特別扱い不要。
     * 戻り値の t は sweep 上の位置(0=開始点, 1=終了点)。
     */
    getSweepHit(sweepStart: Vec2, sweepEnd: Vec2): { t: number; point: Vec2 } | null {
        const r = this.vec() // このEdgeの方向ベクトル
        const s = sweepEnd.sub(sweepStart) // 移動方向ベクトル

        const denom = r.cross(s)
        if (Math.abs(denom) < 1e-9) return null // 平行 or 移動量ゼロ

        const qp = sweepStart.sub(this.start)

        const t = qp.cross(s) / denom // このEdge上のどこで交わるか(0〜1)
        const u = qp.cross(r) / denom // sweep上のどこで交わるか(0〜1)

        const eps = COLLISION_MARGIN / r.magnitude()
        const isHit = t > -eps && t < 1 + eps && u >= 0 && u <= 1

        if (!isHit) return null

        return { t: u, point: sweepStart.add(s.mul(u)) }
    }
}

export const edge = (x0: number, y0: number, x1: number, y1: number, jumpable = true): Edge =>
    new Edge(x0, y0, x1, y1, jumpable)
