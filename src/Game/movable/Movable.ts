import { Vec, vec } from "@ipota/vec"

export abstract class Movable {
    private readonly joints: Vec[]
    private readonly cycle: number

    p = vec(0, 0)
    dp = vec(0, 0) // 【追加】前フレームからの移動量

    private gens: Generator[] = []

    protected constructor(p: Vec, { joints = [], cycle = 1 }: { joints?: Vec[]; cycle?: number } = {}) {
        this.p = p

        this.joints = joints
        this.cycle = Math.max(cycle, 1)

        this.gens.push(this.move())
    }

    update(): void {
        const oldP = this.p // 【追加】移動前の位置を保存
        this.gens = this.gens.filter((gen) => !gen.next().done)
        this.dp = this.p.minus(oldP) // 【追加】移動量を計算
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
                    const offset = from.scaled(1 - ratio).plus(to.scaled(ratio))
                    this.p = offset
                    yield
                }
            }

            yield
        }
    }
}
