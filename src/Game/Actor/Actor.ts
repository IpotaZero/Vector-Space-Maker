import { vec, Vec } from "@ipota/vec"
import { Enemy } from "./Enemy"
import { Bullet } from "./Bullet"
import { Player } from "./Player"
import { DigitalInput } from "@ipota/input"

export type GameLike = {
    player: Player
    enemies: Enemy[]
    bullets: Bullet[]
    input: DigitalInput.Reader<"jump" | "left" | "right" | "fire" | "slash">
    width: number
    height: number
}

export abstract class Actor {
    p: Vec = vec(0, 0)
    r: number = 8
    life = 1

    protected gens: Generator[] = []

    constructor(readonly game: GameLike) {}

    update(game: GameLike) {
        const finished = this.gens.filter((g) => g.next().done)
        this.gens = this.gens.filter((g) => !finished.includes(g))
    }

    protected addScript(g: (me: this) => Generator, { loop = 1, margin = 0 }: { loop?: number; margin?: number } = {}) {
        const me = this

        this.gens.push(
            (function* () {
                yield* Array(margin)

                while (loop--) {
                    yield* g(me)
                }
            })(),
        )
    }
}
