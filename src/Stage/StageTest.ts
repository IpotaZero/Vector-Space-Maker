import { EnemyTest } from "../Enemy/EnemyTest"
import { GameLike } from "../Game/Game"
import { Stage } from "./Stage"

export default class extends Stage {
    protected readonly mapUrl = "assets/map/test2.tmj"

    readonly isBossBattle = true;

    *setup(game: GameLike): Generator<void, void, unknown> {
        game.enemies.push(new EnemyTest(game))
    }
}
