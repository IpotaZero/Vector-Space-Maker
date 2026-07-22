import { Vec } from "@ipota/vec"

const normalizeAngle = (a: number): number => {
    while (a > Math.PI) a -= Math.PI * 2
    while (a < -Math.PI) a += Math.PI * 2
    return a
}

export class Camera {
    p: Vec
    angle = 0
    scale = 1.5

    constructor(start: Vec) {
        this.p = start
    }

    update(target: Vec, gravity: Vec): void {
        // ターゲットへのベクトルを計算
        const diff = target.sub(this.p)

        // 重力方向（画面の垂直方向）の単位ベクトル
        const gDir = gravity.normalize()

        // 垂直方向と水平方向の追従成分に分解
        const diffVertical = gDir.scale(diff.dot(gDir))
        const diffHorizontal = diff.sub(diffVertical)

        // 水平方向は元のまま機敏に（0.1）、垂直方向は緩やかに（0.03程度）追従させる
        const moveHorizontal = diffHorizontal.scale(0.1)
        const moveVertical = diffVertical.scale(0.03)

        // 分解した移動量を加算してカメラ位置を更新
        this.p = this.p.add(moveHorizontal).add(moveVertical)

        // 重力方向が常に画面の「下」を向くように回転させる（既存の処理）
        const targetAngle = Math.PI / 2 - gravity.radian()
        const diffAngle = normalizeAngle(targetAngle - this.angle)
        this.angle += diffAngle * 0.1
    }

    // ctx をカメラ視点に合わせて変換する
    apply(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        ctx.translate(width / 2, height / 2)
        ctx.rotate(this.angle)
        ctx.scale(this.scale, this.scale)
        ctx.translate(-this.p.x, -this.p.y)
    }
}
