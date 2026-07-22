import { vec, Vec } from "@ipota/vec"
import { T } from "../../T"
import { Actor } from "./Actor"
import { Ease } from "@ipota/functions"

export abstract class Enemy extends Actor {
    private shakeP = vec(0, 0)

    draw(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = "black"
        ctx.beginPath()
        ctx.arc(this.p.x + this.shakeP.x, this.p.y + this.shakeP.y, this.r, 0, T)
        ctx.stroke()
    }

    hit() {
        this.addScript(this.hitG.bind(this))
        this.addScript(this.shakeG.bind(this))
    }

    private *hitG() {
        const r = 48
        const frame = 6

        for (let i = 1; i < frame + 1; i++) {
            this.r = r - r * Ease.Out(1 - i / frame) * 0.1
            yield
        }
    }

    private *shakeG() {
        const frame = 10

        for (let i = 1; i < frame + 1; i++) {
            this.shakeP.x = Math.sin(i) * Ease.Out(i / frame)
            this.shakeP.x = Math.cos(i * 2) * Ease.Out(i / frame)
            yield
        }
    }

    protected *moveTo(end: Vec, frame: number) {
        const start = this.p

        for (let i = 0; i < frame; i++) {
            this.p = start.add(end.sub(start).scale(Ease.Out(i / frame)))
            yield
        }
    }
}
