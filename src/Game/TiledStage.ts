import { Movable } from "./movable/Movable"

export class TiledStage {
    constructor(
        readonly width: number,
        readonly height: number,
        readonly movables: Movable[],
        readonly start: { x: number; y: number },
    ) {}
}
