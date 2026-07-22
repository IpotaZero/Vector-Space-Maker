import { Actor } from "./Actor"

export class Bullet extends Actor {
    static WIDTH: number = 100
    static HEIGHT: number = 100

    radian: number = 0
    speed: number = 14
    length: number = 0

    appearance: "donut" | "ball" | "line" | "arrow" | "laser" | "player" = "donut"
    collision: "ball" | "line" | "arrow" | "laser" = "ball"
    type: "friend" | "enemy" | "neutral" = "enemy"
    color: Color = "yellow"
    alpha: number = 1

    private genfs: [g: (me: Bullet) => Generator, config: { loop?: number; margin?: number }][] = []

    clone(): this {
        const b = { ...this }
        // @ts-ignore
        b.__proto__ = this.__proto__

        return b
    }

    init() {
        this.genfs.forEach((g) => {
            this.addScript(...g)
        })

        this.addScript(this.move, { loop: Infinity })
        this.addScript(this.boundary, { loop: Infinity })
    }

    addScriptBook(
        g: (me: Bullet) => Generator,
        { loop = Infinity, margin = 0 }: { loop?: number; margin?: number } = {},
    ) {
        this.genfs.push([g, { loop, margin }])
    }

    private *move() {
        this.p.x += Math.cos(this.radian) * this.speed
        this.p.y += Math.sin(this.radian) * this.speed
        yield
    }

    private *boundary() {
        if (this.p.x < 0 || Bullet.WIDTH < this.p.x || this.p.y < 0 || Bullet.HEIGHT < this.p.y) {
            this.life = 0
        }
        yield
    }
}
