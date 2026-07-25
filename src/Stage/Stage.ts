import { GameLike } from "../Game/Game"
import { Movable } from "../Game/movable/Movable"

import { loadStageFromUrl } from "./loadStageFromJson"

export class Stage {
    protected static readonly mapUrl: string

    isBossBattle = false

    constructor(
        readonly width: number,
        readonly height: number,
        readonly movables: Movable[],
        readonly start: { x: number; y: number },
    ) {}

    static async create(): Promise<Stage> {
        const { width, height, movables, start } = await loadStageFromUrl(this.mapUrl)

        return new this(width, height, movables, start)
    }

    *setup(game: GameLike): Generator<void, void, unknown> {}
}
