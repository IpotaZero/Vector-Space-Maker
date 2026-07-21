import { Actor } from "./Actor"

export abstract class Bullet extends Actor {
    radian: number = 0
    speed: number = 14
    length: number = 0

    appearance: "donut" | "ball" | "line" | "arrow" | "laser" = "donut"
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

        this.addScript(this.move)
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
    }
}
