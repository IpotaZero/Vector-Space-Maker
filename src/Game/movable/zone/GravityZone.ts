import { Vec2 } from "../../../utils/Vec"
import { Game } from "../../Game"
import { Zone } from "./Zone"

// 触れると重力の向き・強さが変わる円形のゾーン
export class GravityZone extends Zone {
    readonly gravity: Vec2

    constructor(
        p: Vec2,
        width: number,
        height: number,
        gravity: Vec2,
        config: { joints?: Vec2[]; cycle?: number } = {},
    ) {
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
        const tip = this.p.add(dir.mul(len))
        ctx.strokeStyle = "#888"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(this.p.x, this.p.y)
        ctx.lineTo(tip.x, tip.y)
        ctx.stroke()

        const back0 = dir.rotate((Math.PI * 4) / 5).mul(8)
        const back1 = dir.rotate((-Math.PI * 4) / 5).mul(8)
        ctx.beginPath()
        ctx.moveTo(tip.x, tip.y)
        ctx.lineTo(tip.x + back0.x, tip.y + back0.y)
        ctx.moveTo(tip.x, tip.y)
        ctx.lineTo(tip.x + back1.x, tip.y + back1.y)
        ctx.stroke()
    }
}
