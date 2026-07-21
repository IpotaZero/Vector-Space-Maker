import { Vec, vec } from "@ipota/vec"
import { Game } from "../../Game"
import { Zone } from "./Zone"

// 触れると重力の向き・強さが変わる円形のゾーン
export class GravityZone extends Zone {
    readonly gravity: Vec

    constructor(p: Vec, width: number, height: number, gravity: Vec, config: { joints?: Vec[]; cycle?: number } = {}) {
        super(p, width, height, config)
        this.gravity = gravity
    }

    override *onEnter({ player }: Game): Generator<void, void, unknown> {
        player.g = this.gravity
    }

    override draw(ctx: CanvasRenderingContext2D): void {
        super.draw(ctx)

        // 中心から重力方向への矢印
        const dir = this.gravity.normalized()
        const len = 30
        const tip = this.p.plus(dir.scaled(len)).plus(vec(this.width / 2, this.height / 2))
        ctx.strokeStyle = "#888"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(this.p.x + this.width / 2, this.p.y + this.height / 2)
        ctx.lineTo(tip.x, tip.y)
        ctx.stroke()

        const back0 = dir.rotated((Math.PI * 4) / 5).scaled(8)
        const back1 = dir.rotated((-Math.PI * 4) / 5).scaled(8)
        ctx.beginPath()
        ctx.moveTo(tip.x, tip.y)
        ctx.lineTo(tip.x + back0.x, tip.y + back0.y)
        ctx.moveTo(tip.x, tip.y)
        ctx.lineTo(tip.x + back1.x, tip.y + back1.y)
        ctx.stroke()
    }
}
