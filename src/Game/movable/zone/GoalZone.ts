import { Vec } from "@ipota/vec"
import { Game } from "../../Game"
import { Zone } from "./Zone"

export class GoalZone extends Zone {
    constructor(p: Vec, width: number, height: number, config: { joints?: Vec[]; cycle?: number } = {}) {
        super(p, width, height, config)
    }

    override *onEnter(game: Game): Generator<void, void, unknown> {
        game.onFinish()
    }
}
