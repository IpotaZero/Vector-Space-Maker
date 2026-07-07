import { Edge } from "./movable/Edge"
import { Movable } from "./movable/Movable"

export class Stage {
    constructor(
        public width: number,
        public height: number,
        public edges: Edge[],
        public movables: Movable[],
        public start: { x: number; y: number },
    ) {}
}
