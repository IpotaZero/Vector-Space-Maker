import { Vec } from "@ipota/vec"
import { Game } from "../../Game.js"
import { Movable } from "../Movable.js"

// 触れると何かが起こる円形のゾーン
export abstract class Zone extends Movable {
    readonly width: number
    readonly height: number

    private coolDown = 0

    constructor(p: Vec, width: number, height: number, config: { joints?: Vec[]; cycle?: number } = {}) {
        super(p, config)
        this.width = width
        this.height = height
    }

    update(): void {
        super.update()
        if (this.coolDown > 0) this.coolDown--
    }

    contains(p: Vec): boolean {
        if (this.coolDown > 0) false
        this.coolDown = 60

        return (
            Math.abs(p.x - this.p.x - this.width / 2) <= this.width / 2 &&
            Math.abs(p.y - this.p.y - this.height / 2) <= this.height / 2
        )
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeStyle = "#888"
        ctx.lineWidth = 1.5
        ctx.setLineDash([6, 6])
        ctx.beginPath()
        ctx.ellipse(
            this.p.x + this.width / 2,
            this.p.y + this.height / 2,
            this.width / 2,
            this.height / 2,
            0,
            0,
            Math.PI * 2,
        )
        ctx.stroke()
        ctx.setLineDash([])
    }

    abstract onEnter(obj: Game): Generator<void, void, unknown>
}
