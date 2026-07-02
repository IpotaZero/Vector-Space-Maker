/**
 * stateの保持、更新を行う。
 */
export class PageState {
    currentPageId: string = "first"
    private history: string[] = []
    private transitioning: boolean = false

    constructor(history: readonly string[] | undefined) {
        // Initialize history
        const first = history && history.length ? history.at(-1)! : "first"
        this.history = history && history.length ? history.slice(0, -1) : []

        this.currentPageId = first
    }

    getHistory(): readonly string[] {
        return this.history
    }

    goto(pageId: string) {
        this.history.push(pageId)
        this.currentPageId = pageId
    }

    back(depth: number): string {
        if (!Number.isInteger(depth) || depth <= 0) throw new Error("depth must be an integer (>= 1).")

        if (this.history.length <= depth) {
            this.history = []
            return "first"
        }

        for (let i = 0; i < depth; i++) {
            this.history.pop()
        }

        return this.history.pop()!
    }

    isTransitioning() {
        return this.transitioning
    }

    startTransition() {
        if (this.transitioning) throw new Error("Pages向けのError: 状態移行中に別の移行を始めようとした。")
        this.transitioning = true
    }

    endTransition() {
        if (!this.transitioning)
            throw new Error("Pages向けのError: 状態移行中じゃあないのに状態変化を終わらせようとした。")
        this.transitioning = false
    }
}
