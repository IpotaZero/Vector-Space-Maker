import { Vec } from "@ipota/vec"
import { T } from "../../T"
import { Actor } from "./Actor"
import { Ease } from "@ipota/functions"

export abstract class Enemy extends Actor {
    draw(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = "black"
        ctx.beginPath()
        ctx.arc(this.p.x, this.p.y, this.r, 0, T)
        ctx.stroke()
    }

    protected *moveTo(end: Vec, frame: number) {
        const start = this.p

        for (let i = 0; i < frame; i++) {
            this.p = start.add(end.sub(start).scale(Ease.Out(i / frame)))
            yield
        }
    }
}
