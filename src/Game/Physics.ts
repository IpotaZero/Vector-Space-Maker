import { Vec, vec } from "@ipota/vec"
import { GameLike } from "./Game"
import { Actor } from "./Actor/Actor"
import { Edge } from "./movable/Edge"

const SKIN = 0.01 // 数値誤差対策のごく小さい押し戻し量
const MAX_SLIDE_ITER = 4 // 1フレームあたりの最大スライド回数

export class Physics {
    constructor(
        private readonly game: GameLike,
        private readonly parent: Actor & { v: Vec; g: Vec },
        private readonly onOnFloor: () => void,
    ) {}

    update() {
        // 重力方向の単位ベクトル
        const gDir = this.parent.g.normalize()
        // 垂直方向と水平方向の速度成分に分解
        const vUp = gDir.scale(this.parent.v.dot(gDir))
        const vHorizontal = this.parent.v.sub(vUp)

        // 水平方向にのみ強い摩擦（例えば0.7など）をかける
        // ※onFloor配列を使って空中と地上の摩擦を変えるのも効果的です
        const newVHorizontal = vHorizontal.scale(0.7)

        // 垂直方向には軽い空気抵抗（終端速度の調整用）をかけるか、そのままにする
        const newVUp = vUp.scale(0.99)

        // 再合成
        this.parent.v = newVHorizontal.add(newVUp)

        this.resolveCollisions()

        this.parent.v = this.parent.v.add(this.parent.g) // 重力の加算
    }

    /**
     * 現在の速度をもとに、衝突を解決しながら実際に this.p を進める。
     * 1フレーム内で複数回当たっても、常に「最も早い衝突」だけを採用し、
     * 残りの移動量でスライドを続けることで、引っかかりを防ぐ。
     */
    private resolveCollisions(): void {
        const floors = this.game.floor

        let start = this.parent.p
        let remaining = this.parent.v // このフレームで進むべき残り移動量

        for (let i = 0; i < MAX_SLIDE_ITER; i++) {
            const end = start.add(remaining)

            let closest: { t: number; point: Vec; floor: Edge } | null = null

            // 最も早く衝突する床を探す
            for (const floor of floors) {
                // 【変更】床の移動量(dp)を考慮し、相対的な移動開始位置を計算して判定する
                const relStart = start.add(floor.dp)
                const hit = floor.getSweepHit(relStart, end)
                if (!hit) continue
                if (!closest || hit.t < closest.t) {
                    closest = { ...hit, floor }
                }
            }

            // 衝突がなければ残り移動量をそのまま適用して終了
            if (!closest) {
                start = end
                break
            }

            const { point, floor } = closest
            const normal = floor.vec().normal() // 常にEdgeの左側（表側）を向く法線

            // 移動開始地点がEdgeの右側(裏側)だったか判定
            // (法線は左側を向いているため、内積が負なら右側にいたことになる)
            const q = start.sub(floor.start)
            const isFromRightSide = q.dot(normal) < 0

            // 床判定
            const verticality = floor.vec().normalize().cross(this.parent.g.normalize())
            if (verticality >= 0.2) {
                this.onOnFloor()
            }

            // 速度成分の打ち消し（速度を殺す）
            const vn = this.parent.v.dot(normal)
            // 左からの衝突(vn < 0)、または右からのすり抜け吸着(isFromRightSide && vn > 0)の場合
            if (vn < 0 || (isFromRightSide && vn > 0)) {
                this.parent.v = this.parent.v.sub(normal.scale(vn))
            }

            // 残り移動量からも成分を除去(スライド または 吸着)
            // ※元コードの斜め衝突時のバグを修正するため、残りの移動量(unconsumed)を基に再計算しています
            const unconsumed = end.sub(point)
            const un = unconsumed.dot(normal)
            if (un < 0 || (isFromRightSide && un > 0)) {
                remaining = unconsumed.sub(normal.scale(un))
            } else {
                remaining = unconsumed
            }

            // 常にEdgeの左側(表側)へSKIN分押し戻す
            // 左からぶつかった場合は「めり込み防止」として機能し、
            // 右から接触した場合は「すり抜けた直後に表側に吸着」として機能する
            start = point.add(normal.scale(SKIN))
        }

        this.parent.p = start
    }
}
