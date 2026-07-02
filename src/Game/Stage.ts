import { Edge } from "./Edge.js"
import { Text } from "./Text.js"
import { Zone } from "./zone/Zone.js"

export class Stage {
    constructor(
        public width: number,
        public height: number,
        public texts: Text[],
        public edges: Edge[],
        public zones: Zone[],
        public start: { x: number; y: number },
        public goal: { x: number; y: number; r: number },
    ) {}
}
