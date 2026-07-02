import { Camera } from "../Camera.js"
import { Player } from "../Player.js"
import { Vec2, vec } from "../../utils/Vec.js"

// 触れると何かが起こる円形のゾーン
export abstract class Zone {
    readonly center: Vec2
    readonly width: number
    readonly height: number

    constructor(x: number, y: number, width: number, height: number) {
        this.center = vec(x, y)
        this.width = width
        this.height = height
    }

    contains(p: Vec2): boolean {
        return Math.abs(p.x - this.center.x) <= this.width / 2 && Math.abs(p.y - this.center.y) <= this.height / 2
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = "#888"
        ctx.lineWidth = 1.5
        ctx.setLineDash([6, 6])
        ctx.beginPath()
        ctx.ellipse(this.center.x, this.center.y, this.width / 2, this.height / 2, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
    }

    abstract onEnter(obj: { player: Player; camera: Camera }): Generator<void, void, unknown>
}
