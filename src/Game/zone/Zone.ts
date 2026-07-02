import { Camera } from "../Camera.js"
import { Player } from "../Player.js"
import { Vec2, vec } from "../../utils/Vec.js"

// 触れると何かが起こる円形のゾーン
export abstract class Zone {
    readonly center: Vec2
    readonly radius: number

    constructor(x: number, y: number, radius: number) {
        this.center = vec(x, y)
        this.radius = radius
    }

    contains(p: Vec2): boolean {
        return p.sub(this.center).magnitude() < this.radius
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = "#888"
        ctx.lineWidth = 1.5
        ctx.setLineDash([6, 6])
        ctx.beginPath()
        ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
    }

    abstract onEnter(obj: { player: Player; camera: Camera }): Generator<void, void, unknown>
}
