export abstract class GameNode {
    protected gens: Generator[] = []

    private sleepFrame: number = 0

    update() {
        if (this.sleepFrame > 0) {
            this.sleepFrame--
            return
        }

        const finished = this.gens.filter((g) => g.next().done)
        this.gens = this.gens.filter((g) => !finished.includes(g))
    }

    sleep(frame: number) {
        this.sleepFrame = frame
    }

    protected addScript(g: (me: this) => Generator, { loop = 1, margin = 0 }: { loop?: number; margin?: number } = {}) {
        const me = this

        this.gens.push(
            (function* () {
                yield* Array(margin)

                while (loop--) {
                    yield* g(me)
                }
            })(),
        )
    }
}
