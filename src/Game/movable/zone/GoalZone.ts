import { Vec2 } from "../../../utils/Vec"
import { Game } from "../../Game"
import { Zone } from "./Zone"

export class GoalZone extends Zone {
    constructor(p: Vec2, width: number, height: number, config: { joints?: Vec2[]; cycle?: number } = {}) {
        super(p, width, height, config)
    }

    override *onEnter(game: Game): Generator<void, void, unknown> {
        game.onFinish()
    }
}
