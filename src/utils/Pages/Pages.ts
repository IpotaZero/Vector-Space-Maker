import { Transition } from "../Functions/Transition"
import { PageDom } from "./PageDom"
import { PageEventSetter } from "./PageEventSetter"
import { PageState } from "./PageState"

export type FadeOption = Partial<{ msIn: number; msOut: number }>
export type GotoOption = FadeOption & {
    button?: HTMLButtonElement
    back?: boolean
}

type AnimateArgs = Parameters<HTMLElement["animate"]>
type TransitionArgs = {
    from: AnimateArgs
    to: AnimateArgs
}

export type PageTransition = (
    animate: (element: HTMLElement, ...args: AnimateArgs) => Animation,
    from: HTMLElement,
    to: HTMLElement,
) => Promise<void>

type LoadOption = Partial<{ history: readonly string[]; override: boolean }>

/**
 * Pages <- Dom, Run, State, EventSetter
 */

export class Pages {
    private static cache = new Map<string, string>()

    private dom!: PageDom
    private state!: PageState

    static onTransitionStart = (pages: Pages) => {}
    static onTransitionEnd = (pages: Pages) => {}

    getHistory() {
        return this.state.getHistory()
    }

    private readonly transitions: Record<string, Record<string, PageTransition>> = {}

    setTransition(from: string, to: string, forward: TransitionArgs) {
        if (!this.transitions[from]) {
            this.transitions[from] = {}
        }

        this.transitions[from][to] = async (animate, fromPage, toPage) => {
            await this.animatePair(animate, fromPage, toPage, forward)
        }
    }

    private async animatePair(
        animate: (element: HTMLElement, ...args: AnimateArgs) => Animation,
        from: HTMLElement,
        to: HTMLElement,
        args: TransitionArgs,
    ) {
        to.classList.remove("hidden")

        const fromAnimation = animate(from, ...args.from)
        const toAnimation = animate(to, ...args.to)

        await Promise.all([fromAnimation.finished, toAnimation.finished])
        from.classList.add("hidden")
        fromAnimation.cancel()
        toAnimation.cancel()
    }

    private reverseAnimateArgs([keyframes, options]: AnimateArgs): AnimateArgs {
        if (typeof options === "number") {
            return [keyframes, options]
        }

        return [keyframes, { ...(options ?? {}), direction: "reverse" }]
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

        // イベントバインドを外部に委譲
        PageEventSetter.setOnclick(this.dom.container, {
            enter: this.enter.bind(this),
            back: this.back.bind(this),
        })

        this.state = new PageState(history)

        await this.goto(this.state.currentPageId, { msIn: 0, msOut: 0 })
    }

    getPage(pageId: string, option: { noError: true }): HTMLElement | undefined
    getPage(pageId: string, option?: { noError?: false }): HTMLElement
    getPage(pageId: string, option: { noError?: boolean } = {}) {
        if (option.noError) {
            return this.dom.getPage(pageId, { noError: true })
        }

        return this.dom.getPage(pageId)
    }

    getAllPages(pageId: string) {
        return this.dom.getAllPages(pageId)
    }

    getCurrentPage() {
        return this.dom.getPage(this.state.currentPageId)
    }

    getCurrentPageId(): string {
        return this.state.currentPageId
    }

    isTransitioning(): boolean {
        return this.state.isTransitioning()
    }

    async back(depth: number, option: FadeOption = {}) {
        await this.goto(this.state.back(depth), Object.assign(option, { back: true }))
    }

    async enter(id: string, option: FadeOption = {}) {
        await this.goto(id, Object.assign(option, { back: false }))
    }

    private async goto(id: string, option: GotoOption) {
        // 0. 遷移中に別の遷移が発生しないように
        if (this.state.isTransitioning()) return

        this.state.startTransition()
        Pages.onTransitionStart(this)

        // layerに応じて場合分け
        const layerFrom = parseToNumber(
            this.dom.getPage(this.state.currentPageId, { noError: true })?.dataset["layer"],
            0,
        )
        const layerTo = parseToNumber(this.dom.getPage(id, { noError: true })?.dataset["layer"], 0)

        await this.transition(layerFrom, layerTo, id, option)

        // 5. 遷移完了
        this.state.endTransition()
    }

    private async transition(
        layerFrom: number,
        layerTo: number,
        id: string,
        { button, back, msIn = 200, msOut = 200 }: GotoOption,
    ) {
        const currentPageId = this.state.currentPageId
        const transition =
            this.transitions[currentPageId]?.[id] ?? this.getDefaultPageTransition(layerFrom, layerTo, msIn, msOut)

        if (layerFrom === layerTo) {
            await this.dom.fade(currentPageId, id, transition)
            this.state.goto(id)
            Pages.onTransitionEnd(this)
            return
        }

        if (layerFrom < layerTo) {
            this.state.goto(id)
            Pages.onTransitionEnd(this)
            await this.dom.fade(currentPageId, id, transition)
            return
        }

        if (!back) throw new Error("下のlayerにback以外でgotoしようとした。")

        await this.dom.fade(currentPageId, id, transition)
        this.state.goto(id)
        Pages.onTransitionEnd(this)
    }

    private getDefaultPageTransition(layerFrom: number, layerTo: number, msIn: number, msOut: number): PageTransition {
        if (layerFrom === layerTo) {
            return async (_animate, from, to) => {
                await Transition.fadeOut(from, msIn)
                from.classList.add("hidden")
                await Transition.fadeIn(to, msOut)
                to.classList.remove("hidden")
            }
        }

        if (layerFrom < layerTo) {
            return async (_animate, _from, to) => {
                to.classList.remove("hidden")
                await Transition.fadeIn(to, msOut)
            }
        }

        return async (_animate, from, _to) => {
            await Transition.fadeOut(from, msIn)
            from.classList.add("hidden")
        }
    }
}

export function parseToNumber(str: string | undefined | null, defaultValue: number) {
    if (!str) return defaultValue

    if (Number.isNaN(Number(str))) return defaultValue

    return Number(str)
}
