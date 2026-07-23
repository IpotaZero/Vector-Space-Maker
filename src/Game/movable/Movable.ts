import { Vec, vec } from "@ipota/vec"
import { GameNode } from "../GameNode"

export abstract class Movable extends GameNode {
    private readonly joints: Vec[]
    private readonly cycle: number

    p = vec(0, 0)
    dp = vec(0, 0) // 【追加】前フレームからの移動量

    protected constructor(p: Vec, { joints = [], cycle = 1 }: { joints?: Vec[]; cycle?: number } = {}) {
        super()

        this.p = p

        this.joints = joints
        this.cycle = Math.max(cycle, 1)

        this.addScript(() => this.move())
    }

    update(): void {
        const oldP = this.p // 【追加】移動前の位置を保存
        super.update()
        this.dp = this.p.sub(oldP) // 【追加】移動量を計算
    }

    abstract draw(ctx: CanvasRenderingContext2D): void

    private *move() {
        if (this.joints.length === 0) return

        while (1) {
            for (let i = 0; i < this.joints.length - 1; i++) {
                const from = this.joints[i]
                const to = this.joints[i + 1]

                for (let t = 0; t < this.cycle; t++) {
                    const ratio = t / this.cycle
                    const offset = from.scale(1 - ratio).add(to.scale(ratio))
                    this.p = offset
                    yield
                }
            }

            yield
        }
    }
}
