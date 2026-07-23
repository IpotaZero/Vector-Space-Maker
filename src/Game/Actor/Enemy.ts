import { vec, Vec } from "@ipota/vec"
import { Actor } from "./Actor"
import { Ease } from "@ipota/functions"
import { GameLike } from "../Game"
import { Ctx } from "../../utils/Functions/Ctx"

export abstract class Enemy extends Actor {
    private shakeP = vec(0, 0)
    private maxLife: number

    constructor(game: GameLike, life: number) {
        super(game)
        this.life = life
        this.maxLife = life
    }

    draw(ctx: CanvasRenderingContext2D) {
        Ctx.arc(ctx, this.p.l, this.r, "black", { lineWidth: 1 })

        const w = this.game.width / 2

        Ctx.rect(ctx, [w - 64, 64], [w, 32], "black", { lineWidth: 1 })
        Ctx.rect(ctx, [w - 64 + w * (1 - this.life / this.maxLife), 64], [w * (this.life / this.maxLife), 32], "gray", {
            lineWidth: 0,
        })
    }

    hit() {
        this.addScript(this.hitG.bind(this))
        this.addScript(this.shakeG.bind(this))
    }

    *onDead(): Generator {}

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
