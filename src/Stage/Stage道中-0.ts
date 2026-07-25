import { EnemyTest } from "../Enemy/EnemyTest"
import { GameLike } from "../Game/Game"
import { Stage } from "./Stage"

export default class extends Stage {
    protected readonly mapUrl = "assets/map/道中-0.tmj";

    *setup(game: GameLike): Generator<void, void, unknown> {}
}
