import { Ease } from "../../../utils/Functions/Ease"
import { Vec2 } from "../../../utils/Vec"
import { Game } from "../../Game"
import { Zone } from "./Zone"

export class ScaleZone extends Zone {
    readonly scale: number

    constructor(
        p: Vec2,
        width: number,
        height: number,
        scale: number,
        config: { joints?: Vec2[]; cycle?: number } = {},
    ) {
        super(p, width, height, config)
        this.scale = scale
    }

    override *onEnter({ camera }: Game): Generator<void, void, unknown> {
        const frame = 15

        const startScale = camera.scale
        const diffScale = this.scale - startScale

        for (let i = 0; i < frame; i++) {
            camera.scale = startScale + diffScale * Ease.Out((i + 1) / frame)
            yield
        }
    }
}
