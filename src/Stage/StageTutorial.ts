import { GameLike } from "../Game/Game"
import { Stage } from "./Stage"

export default class extends Stage {
    protected static readonly mapUrl = "assets/map/tutorial.tmj";

    *setup(game: GameLike): Generator<void, void, unknown> {}
}
