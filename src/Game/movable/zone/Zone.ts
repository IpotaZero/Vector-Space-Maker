import { Vec } from "@ipota/vec"
import { Game } from "../../Game.js"
import { Movable } from "../Movable.js"

// 触れると何かが起こる円形のゾーン
export abstract class Zone extends Movable {
    readonly width: number
    readonly height: number

    /** 直前のフレームでpがゾーン内にいたかどうか(「入った瞬間」判定用) */
    private inside = false

    constructor(p: Vec, width: number, height: number, config: { joints?: Vec[]; cycle?: number } = {}) {
        super(p, config)
        this.width = width
        this.height = height
    }

    /**
     * このフレームで p がゾーンの外から中へ入った瞬間だけ true を返す。
     * 触れ続けている間は再度 true にならず、一度離れて再び触れると
     * また true になる。（SEや演出がゾーンに触れ続けている間ずっと
     * 再発火してしまうのを防ぐための「エッジ検出」方式）
     */
    checkEnter(p: Vec): boolean {
        const nowInside = this.isInsideArea(p)
        const justEntered = nowInside && !this.inside
        this.inside = nowInside
        return justEntered
    }

    private isInsideArea(p: Vec): boolean {
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
