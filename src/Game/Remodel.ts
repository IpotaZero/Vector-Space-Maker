import { Ease } from "@ipota/functions"
import { Vec, vec } from "@ipota/vec"
import { Bullet } from "./Actor/Bullet"
import { Enemy } from "./Actor/Enemy"
import { T } from "../T"
import { GenUtils } from "@ipota/functions"
import { NumberKeys } from "../utils/NumberKeys"

export function remodel<Cls extends Bullet>(e: Enemy, model: Cls) {
    return new Proxy(new Remodel([model], e), {
        get(target, key) {
            if (key in target) return (target as any)[key]

            return function (this: Mod, value: any) {
                return this.set(key as any, value)
            }
        },
    }) as Mod
}

type Mod = Remodel & {
    [key in keyof Bullet]: (value: Bullet[key]) => Mod
}

export class Remodel {
    constructor(
        private bullets: Bullet[],
        private readonly e: Enemy,
    ) {}

    class<Cls extends typeof Bullet>(cls: Cls) {
        // @ts-ignore
        this.set("__proto__", cls.prototype)
    }

    fire(bullets: Bullet[]) {
        this.bullets.forEach((b) => {
            b.init()
        })

        bullets.push(...this.bullets)
    }

    static *homing(me: Bullet, p: Vec, frame: number) {
        for (let i = 0; i < frame; i++) {
            me.radian = p.minus(me.p).radian()
            yield
        }
    }

    static *appear(me: Bullet, frame: number = 30) {
        const r = me.r
        me.r = 0
        yield* this.ease(me, "r", r, frame, Ease.Out)
    }

    static *reaccel(
        me: Bullet & { speed: number },
        stopFrame: number,
        waitFrame: number,
        accelFrame: number,
        finalSpeed?: number,
    ) {
        const initialSpeed = me.speed
        yield* this.stop(me, stopFrame)
        yield* Array(waitFrame)
        yield* this.accel(me, accelFrame, finalSpeed ?? initialSpeed)
    }

    static *stop(me: Bullet, stopFrame: number) {
        yield* this.accel(me, stopFrame, 0)
    }

    static *accel(me: Bullet, frame: number, finalSpeed: number) {
        yield* this.ease(me, "speed", finalSpeed, frame, Ease.Linear)
    }

    static *fadeout(me: Bullet, frame: number) {
        me.type = "neutral"
        yield* this.ease(me, "alpha", 0, frame, Ease.Linear)
        me.life = 0
    }

    static *ease(
        me: Bullet,
        key: NumberKeys<Bullet>,
        target: number,
        frame: number,
        easing: (t: number) => number = Ease.Out,
        floor?: number,
    ) {
        const start = me[key]

        if (floor) {
            for (let i = 1; i < frame + 1; i++) {
                ;(me as any)[key] = Math.floor(((target - start) * easing(i / frame) + start) * floor) / floor
                yield
            }
        } else {
            for (let i = 1; i < frame + 1; i++) {
                ;(me as any)[key] = (target - start) * easing(i / frame) + start
                yield
            }
        }
    }

    colorful(seed: number) {
        return this.set("color", `hsl(${seed % 360},100%,50%)`)
    }

    aim(target: Vec) {
        return this.forEach((b) => {
            b.radian = target.minus(b.p).radian()
        })
    }

    sim(num: number, min: number, max: number) {
        return this.duplicate(num, (b, i) => {
            b.speed = (max - min) * (i / (num - 1)) + min
            return b
        })
    }

    nway(num: number, angle: number) {
        return this.duplicate(num, (b, i) => {
            b.radian += angle * (i - (num - 1) / 2)
            b.radian = Math.floor((b.radian % T) * 128) / 128
            return b
        })
    }

    shift(num: number, shift: number) {
        return this.duplicate(num, (b, i) => {
            const shiftVec = vec.arg(b.radian + T / 4).scaled(shift * (i - (num - 1) / 2))
            b.p = b.p.plus(shiftVec)
            return b
        })
    }

    duplicate(num: number, map: (me: Bullet, index: number) => Bullet): Mod {
        const result: Bullet[] = []

        const length = this.bullets.length

        for (let i = 0; i < length; i++) {
            const bullet = this.bullets[i]

            for (let j = 0; j < num; j++) {
                result.push(map(bullet.clone(), j))
            }
        }

        this.bullets = result

        return this as unknown as Mod
    }

    circle(distance: number, radius: number, { direction = "none" }: { direction?: "inner" | "outer" | "none" } = {}) {
        const num = Math.ceil((T * radius) / distance)
        return this.duplicate(num, (b, i) => {
            const angle = (T / num) * i
            b.p = b.p.plus(vec.arg(angle).scaled(radius))

            if (direction === "inner") {
                b.radian = T * (i / num + 0.5)
            } else if (direction === "outer") {
                b.radian = T * (i / num)
            }

            return b
        })
    }

    ex(num: number) {
        return this.duplicate(num, (b, i) => {
            b.radian = b.radian + Math.PI * 2 * (i / num)
            b.radian = Math.floor((b.radian % T) * 128) / 128
            return b
        })
    }

    bounce(count: number, width: number, height: number) {
        let c = count

        return this.g(function* (b) {
            while (c > 0) {
                yield

                if (b.p.x < -width / 2) {
                    b.p.x = -width / 2
                    b.radian = Math.PI - b.radian
                    c--
                } else if (b.p.x > width / 2) {
                    b.p.x = width / 2
                    b.radian = Math.PI - b.radian
                    c--
                }
            }
        })
    }

    beam(e: Enemy, length: number) {
        return (this as unknown as Mod)
            .length(length)
            .speed(0)
            .r(12)
            .color("cyan")
            .g(function* (me) {
                let i = 0

                while (1) {
                    i++
                    me.alpha = 0.8 * (Math.sin(i / 10) + 1) + 0.8

                    me.p = e.p

                    if (e.life <= 0) {
                        break
                    }

                    yield
                }

                yield* Remodel.fadeout(me, 15)
            })
    }

    laser(e: Enemy, waitFrame: number, existsFrame: number, length: number) {
        return (this as unknown as Mod)
            .length(length)
            .speed(0)
            .type("neutral")
            .alpha(0)
            .r(2)
            .color("yellow")
            .g(function* (me) {
                yield* Remodel.ease(me, "alpha", 0.1, 30, Ease.Out)
                yield* Array(waitFrame)
                me.type = "enemy"
                yield* GenUtils.parallel(
                    Remodel.ease(me, "r", 8, 30, Ease.Out),
                    Remodel.ease(me, "alpha", 1, 30, Ease.Out),
                    //
                )
                yield* Array(existsFrame)
                yield* Remodel.fadeout(me, 15)
            })
            .g(function* (me) {
                while (e.life > 0) yield
                yield* Remodel.fadeout(me, 30)
            })
    }

    delete(frame: number = 0) {
        return this.g(function* (b) {
            for (let i = 0; i < frame; i++) yield
            b.life = 0
        })
    }

    g(g: (this: Enemy, me: Bullet, index: number) => Generator, config: { loop?: number; margin?: number } = {}) {
        const e = this.e

        this.bullets.forEach((b, index) => {
            b.addScriptBook(function* (me) {
                yield* g.bind(e)(me, index)
            }, config)
        })

        return this
    }

    forEach(handler: (me: Bullet, index: number) => void) {
        this.bullets.forEach(handler)
        return this
    }

    set<K extends keyof Bullet, V extends Bullet[K]>(key: K, value: V) {
        this.bullets.forEach((b) => {
            b[key] = value
        })

        return this
    }
}
