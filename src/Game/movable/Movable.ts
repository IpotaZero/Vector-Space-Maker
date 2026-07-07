import { Vec2, vec } from "../../utils/Vec"

export abstract class Movable {
    private readonly joints: Vec2[]
    private readonly cycle: number

    p = vec(0, 0)

    private gens: Generator[] = []

    protected constructor(p: Vec2, { joints = [], cycle = 1 }: { joints?: Vec2[]; cycle?: number } = {}) {
        this.p = p

        this.joints = joints
        this.cycle = Math.max(cycle, 1)

        this.gens.push(this.move())
    }

    update(): void {
        this.gens = this.gens.filter((gen) => !gen.next().done)
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
                    const offset = from.mul(1 - ratio).add(to.mul(ratio))
                    this.p = offset
                    yield
                }
            }

            yield
        }
    }
}
