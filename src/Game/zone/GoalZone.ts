import { Game } from "../Game"
import { Zone } from "./Zone"

export class GoalZone extends Zone {
    override *onEnter(game: Game): Generator<void, void, unknown> {
        game.onFinish()
    }
}
