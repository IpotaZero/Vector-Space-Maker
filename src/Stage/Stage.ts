import { GameLike } from "../Game/Game"

import * as tiled from "@kayahr/tiled"

export abstract class Stage {
    protected abstract readonly mapUrl: string

    async getMapData(): Promise<tiled.Map> {
        return (await fetch(`${this.mapUrl}`).then((res) => res.json())) as tiled.Map
    }

    abstract setup(game: GameLike): Generator<void, void, unknown>
}
