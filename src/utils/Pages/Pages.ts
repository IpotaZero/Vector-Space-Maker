import { CallbackHandler } from "../CallbackHandler"
import { PageDom } from "./PageDom"
import { PageState } from "./PageState"
import { parseToNumber } from "./parseToNumber"
import { defaultTransition } from "./defaultTransition"

export type FadeOption = { msIn: number; msOut: number }

export type GotoOption = FadeOption & {
    isBack: boolean
}

export type TransitionArgs = {
    from: (args: { from: HTMLElement; to: HTMLElement }) => Promise<void>
    to: (args: { from: HTMLElement; to: HTMLElement }) => Promise<void>
    crossfade?: boolean
}

export type LoadOption = Partial<{ history: readonly string[]; override: boolean }>

/**
 * Pages <- Dom, Run, State, EventSetter
 */

export class Pages {
    private static cache = new Map<string, string>()

    private dom!: PageDom
    private state!: PageState

    private readonly ch = new CallbackHandler<
        "transition-start" | "transition-end" | `before-enter-${string}` | `on-enter-${string}` | `on-exit-${string}`,
        Pages
    >()

    private ac = new AbortController()

    dispose() {
        this.ac.abort()
    }

    onTransitionStart = this.ch.on.bind(this.ch, "transition-start")
    onTransitionEnd = this.ch.on.bind(this.ch, "transition-end")
    beforeEnter = (pageId: string, callback: (pages: Pages) => void) => this.ch.on(`before-enter-${pageId}`, callback)
    onEnter = (pageId: string, callback: (pages: Pages) => void) => this.ch.on(`on-enter-${pageId}`, callback)
    onExit = (pageId: string, callback: (pages: Pages) => void) => this.ch.on(`on-exit-${pageId}`, callback)

    getHistory() {
        return this.state.getHistory()
    }

    private readonly transitions: Record<string, Record<string, TransitionArgs>> = {}

    setTransition(from: string, to: string, forward: TransitionArgs) {
        if (!this.transitions[from]) {
            this.transitions[from] = {}
        }

        this.transitions[from][to] = forward
    }

    async loadFromFile(container: HTMLElement, path: string, options: LoadOption = {}) {
        if (!Pages.cache.has(path)) {
            const html = await fetch(path).then((res) => res.text())
            Pages.cache.set(path, html)
        }

        await this.load(container, Pages.cache.get(path)!, options)
    }

    async load(container: HTMLElement, html: string, { history, override = true }: LoadOption = {}) {
        if (this.dom) {
            throw new Error("Pages have already been loaded")
        }

        this.dom = new PageDom(container, html, override)
        await this.dom.ready

        this.setOnclick(this.dom.container)

        this.state = new PageState(history)

        await this.goto(this.state.getCurrentPageId(), { msIn: 0, msOut: 0, isBack: false })
    }

    getPage(pageId: string, option: { noError: true }): HTMLElement | undefined
    getPage(pageId: string, option?: { noError?: false }): HTMLElement
    getPage(pageId: string, option: { noError?: boolean } = {}) {
        if (option.noError) {
            return this.dom.getPage(pageId, { noError: true })
        }

        return this.dom.getPage(pageId)
    }

    getElement<Class extends typeof HTMLElement>(query: string, cls?: Class): InstanceType<Class> {
        const element = this.dom.container.querySelector(query)

        if (element === null) {
            throw new Error("そんな要素はない。")
        }

        if (cls && !(element instanceof cls)) {
            throw new Error(`${cls.name}でなかった。`)
        }

        return element as InstanceType<Class>
    }

    getAllPages(pageId: string) {
        return this.dom.getAllPages(pageId)
    }

    getCurrentPage() {
        return this.dom.getPage(this.state.getCurrentPageId())
    }

    getCurrentPageId(): string {
        return this.state.getCurrentPageId()
    }

    async back(depth: number, option: Partial<FadeOption> = {}) {
        await this.goto(this.state.back(depth), Object.assign(option, { msIn: 100, msOut: 100, isBack: true }))
    }

    async enter(id: string, option: Partial<FadeOption> = {}) {
        await this.goto(id, Object.assign(option, { msIn: 100, msOut: 100, isBack: false }))
    }

    private async goto(nextPageId: string, option: GotoOption) {
        this.transition(this.getCurrentPage(), this.dom.getPage(nextPageId, { noError: true }), nextPageId, option)
    }

    private async transition(
        from: HTMLElement,
        to: HTMLElement | undefined,
        nextPageId: string,
        { isBack, msIn, msOut }: GotoOption,
    ) {
        const result = await this.ch.run(`before-enter-${nextPageId}`, this)
        if (!result) {
            return
        }

        if (!to) {
            throw new Error("止めろ。")
        }

        const layerFrom = parseToNumber(from.dataset.layer, 0)
        const layerTo = parseToNumber(to.dataset.layer, 0)

        if (layerFrom > layerTo && !isBack) {
            console.error(`下のlayerにback以外でgotoしようとした。from: ${layerFrom}, to: ${layerTo}`)
            this.ch.run("transition-end", this)
            return
        }

        this.ch.run("transition-start", this)

        const currentPageId = this.state.getCurrentPageId()
        const transition = this.transitions[currentPageId]?.[nextPageId] ?? defaultTransition(from, to, msIn, msOut)

        this.state.goto(nextPageId)
        this.dom.animate(from, to, layerFrom, layerTo, transition)

        this.ch.run(`on-exit-${currentPageId}`, this)
        this.ch.run(`on-enter-${nextPageId}`, this)

        this.ch.run("transition-end", this)
    }

    private readonly DEFAULT_IN_MS = 100
    private readonly DEFAULT_OUT_MS = 100

    private setOnclick(container: HTMLElement) {
        container.addEventListener(
            "click",
            (e) => {
                const target = e.target
                if (!target || !(target instanceof HTMLButtonElement)) return

                if (target.hasAttribute("data-link")) {
                    const id = target.dataset["link"] || "first"
                    const msIn = parseToNumber(target.dataset["msIn"], this.DEFAULT_IN_MS)
                    const msOut = parseToNumber(target.dataset["msOut"], this.DEFAULT_OUT_MS)
                    this.enter(id, { msIn, msOut })
                } else if (target.hasAttribute("data-back")) {
                    const depth = parseToNumber(target.dataset["back"], 1)
                    const msIn = parseToNumber(target.dataset["msIn"], this.DEFAULT_IN_MS)
                    const msOut = parseToNumber(target.dataset["msOut"], this.DEFAULT_OUT_MS)

                    this.back(depth, { msIn, msOut })
                }
            },
            { signal: this.ac.signal },
        )
    }
}
