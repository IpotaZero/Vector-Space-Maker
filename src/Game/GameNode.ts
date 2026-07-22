export abstract class GameNode {
    protected gens: Generator[] = []

    update() {
        const finished = this.gens.filter((g) => g.next().done)
        this.gens = this.gens.filter((g) => !finished.includes(g))
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
