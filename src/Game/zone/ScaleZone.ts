import { Camera } from "../Camera"
import { Player } from "../Player"
import { Zone } from "./Zone"

export class ScaleZone extends Zone {
    readonly scale: number

    constructor(x: number, y: number, radius: number, scale: number) {
        super(x, y, radius)
        this.scale = scale
    }

    override *onEnter({ camera }: { player: Player; camera: Camera }): Generator<void, void, unknown> {
        const frame = 15

        const startScale = camera.scale
        const diffScale = this.scale - startScale

        for (let i = 0; i < frame; i++) {
            camera.scale = startScale + (diffScale * (i + 1)) / frame
            yield
        }
    }
}
