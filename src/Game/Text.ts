export class Text {
    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number,
        public rotation: number,
        public text: string,
        public fontSize: number = 16,
    ) {}

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)
        ctx.fillStyle = "#000"
        ctx.font = `${this.fontSize}px normal, japanese`
        // ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillText(this.text, 0, 0)
        ctx.restore()
    }
}
