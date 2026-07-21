import { vec, Vec } from "../../utils/Vec.js"
import { Movable } from "./Movable.js"

export class TextObject extends Movable {
    constructor(
        p: Vec,
        public width: number,
        public height: number,
        public rotation: number,
        public text: string,
        public fontSize: number = 16,
        config: { joints?: Vec[]; cycle?: number } = {},
    ) {
        super(p, config)
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save()
        ctx.translate(this.p.x, this.p.y)
        ctx.rotate(this.rotation)
        ctx.fillStyle = "#000"
        ctx.font = `${this.fontSize}px normal, japanese`
        // ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillText(this.text, 0, 0)
        ctx.restore()
    }
}
