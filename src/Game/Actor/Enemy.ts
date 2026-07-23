import { vec, Vec } from "@ipota/vec"
import { Actor } from "./Actor"
import { Ease } from "@ipota/functions"
import { GameLike } from "../Game"
import { Ctx } from "../../utils/Functions/Ctx"
import { GltfViewer } from "../../utils/GltfViewer"
import { remodel } from "../Remodel"
import { T } from "../../T"

export abstract class Enemy extends Actor {
    private shakeP = vec(0, 0)
    private maxLife: number
    private frame = 0

    protected gltfViewer

    constructor(game: GameLike, life: number, r: number) {
        super(game)
        this.life = life
        this.maxLife = life

        this.r = r

        this.gltfViewer = new GltfViewer(this.r * 4, this.r * 4)
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.frame++

        Ctx.arc(ctx, this.p.l, 48, "#00000020", { lineWidth: 1 })
        Ctx.polygon(ctx, 13, 3, this.p.l, 48 * 1.1, "#00000020", { lineWidth: 1, theta: this.frame / 60 })
        Ctx.polygon(ctx, 9, 2, this.p.l, 48 * 0.6, "#00000020", { lineWidth: 1, theta: this.frame / 120 })

        const w = this.game.width / 2

        Ctx.rect(ctx, [w - 64, 64], [w, 32], "#80808080", { lineWidth: 1 })
        Ctx.rect(
            ctx,
            [w - 64 + (1 - this.life / this.maxLife), 64],
            [w * (1 - this.life / this.maxLife), 32],
            "#80808080",
            {
                lineWidth: 0,
            },
        )

        this.gltfViewer.update()
        ctx.drawImage(this.gltfViewer.canvas, this.p.x - this.r * 2, this.p.y - this.r * 2, this.r * 4, this.r * 4)
    }

    hit() {
        this.addScript(this.hitG.bind(this))
        this.addScript(this.shakeG.bind(this))
    }

    *onDead(): Generator {
        yield* remodel(this)
            .type("effect")
            .alpha(0.5)
            .p(this.p.clone())
            .duplicate(63, (me, i) => {
                me.radian = Math.random() * T
                me.speed = Math.random() * 4 + 4
                return me
            })
            .g(function* (me) {
                const frame = 60
                for (let i = 1; i < frame + 1; i++) {
                    me.alpha = 0.5 * (1 - i / frame)
                    yield
                }
                me.life = 0
            })
            .fire(this.game.bullets)
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
