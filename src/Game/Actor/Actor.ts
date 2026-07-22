import { vec, Vec } from "@ipota/vec"
import { GameNode } from "../GameNode"
import { GameLike } from "../Game"

export abstract class Actor extends GameNode {
    p: Vec = vec(0, 0)
    r: number = 8
    life = 1

    constructor(readonly game: GameLike) {
        super()
    }
}
