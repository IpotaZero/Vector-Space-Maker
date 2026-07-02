import { Vec2 } from "../utils/Vec.js"

const normalizeAngle = (a: number): number => {
    while (a > Math.PI) a -= Math.PI * 2
    while (a < -Math.PI) a += Math.PI * 2
    return a
}

export class Camera {
    p: Vec2
    angle = 0
    scale = 1

    constructor(start: Vec2) {
        this.p = start
    }

    update(target: Vec2, gravity: Vec2): void {
        this.p = this.p.add(target.sub(this.p).mul(0.1))

        // 重力方向が常に画面の「下」を向くように回転させる
        const targetAngle = Math.PI / 2 - gravity.angle()
        const diff = normalizeAngle(targetAngle - this.angle)
        this.angle += diff * 0.1
    }

    // ctx をカメラ視点に合わせて変換する
    apply(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        ctx.translate(width / 2, height / 2)
        ctx.rotate(this.angle)
        ctx.scale(this.scale, this.scale)
        ctx.translate(-this.p.x, -this.p.y)
    }
}
