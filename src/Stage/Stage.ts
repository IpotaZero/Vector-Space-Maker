import { GameLike } from "../Game/Game"
import { Movable } from "../Game/movable/Movable"

import { EnemySpawn, loadStageFromUrl } from "./loadStageFromJson"

export class Stage {
    protected static readonly mapUrl: string

    isBossBattle = false

    constructor(
        readonly width: number,
        readonly height: number,
        readonly movables: Movable[],
        readonly start: { x: number; y: number },
        readonly enemySpawns: EnemySpawn[] = [],
    ) {}

    static async create(): Promise<Stage> {
        const { width, height, movables, start, enemySpawns } = await loadStageFromUrl(this.mapUrl)

        console.log("Stage.create", { width, height, movables, start, enemySpawns })

        return new this(width, height, movables, start, enemySpawns)
    }

    *setup(game: GameLike): Generator<void, void, unknown> {}
}
