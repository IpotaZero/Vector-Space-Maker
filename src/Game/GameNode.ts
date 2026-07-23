export abstract class GameNode {
    protected scripts = new Map<string, Generator>()

    private sleepFrame: number = 0

    update() {
        if (this.sleepFrame > 0) {
            this.sleepFrame--
            return
        }

        const finished = this.scripts
            .entries()
            .filter(([id, g]) => g.next().done)
            .map(([id, _]) => id)

        finished.forEach((id) => {
            this.scripts.delete(id)
        })
    }

    sleep(frame: number) {
        this.sleepFrame = frame
    }

    protected addScript(
        g: (me: this) => Generator,
        { loop = 1, margin = 0, id }: { loop?: number; margin?: number; id?: string } = {},
    ) {
        const me = this

        const ID = id ?? crypto.randomUUID()

        this.scripts.set(
            ID,
            (function* () {
                yield* Array(margin)

                while (loop--) {
                    yield* g(me)
                }
            })(),
        )
    }

    protected removeScript(id: string) {
        this.scripts.delete(id)
    }
}
