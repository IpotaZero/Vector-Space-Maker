/**
 * stateの保持、更新を行う。
 */
export class PageState {
    private currentPageId: string = "first"
    private history: string[] = []

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

    getCurrentPageId(): string {
        return this.currentPageId
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
}
