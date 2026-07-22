import { Movable } from "./movable/Movable"

export class Stage {
    constructor(
        public width: number,
        public height: number,
        public movables: Movable[],
        public start: { x: number; y: number },
    ) {}
}
