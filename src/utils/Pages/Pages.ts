import { PageDom } from "./PageDom"
import { GotoOption, PageEventSetter } from "./PageEventSetter"
import { PageState } from "./PageState"
import { parseToNumber } from "./parseToNumber"

export type FadeOption = Partial<{ msIn: number; msOut: number }>

export type AnimateArgs = Parameters<HTMLElement["animate"]>
export type TransitionArgs = {
    from: AnimateArgs
    to: AnimateArgs
    crossFade?: boolean
}

export type LoadOption = Partial<{ history: readonly string[]; override: boolean }>

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

        // イベントバインドを外部に委譲
        PageEventSetter.setOnclick(this.dom.container, {
            enter: this.enter.bind(this),
            back: this.back.bind(this),
        })

        this.state = new PageState(history)

        await this.goto(this.state.getCurrentPageId(), { msIn: 0, msOut: 0 })
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
        return this.dom.getPage(this.state.getCurrentPageId())
    }

    getCurrentPageId(): string {
        return this.state.getCurrentPageId()
    }

    async back(depth: number, option: FadeOption = {}) {
        await this.goto(this.state.back(depth), Object.assign(option, { isBack: true }))
    }

    async enter(id: string, option: FadeOption = {}) {
        await this.goto(id, Object.assign(option, { isBack: false }))
    }

    private async goto(id: string, option: GotoOption) {
        // layerに応じて場合分け
        const layerFrom = parseToNumber(
            this.dom.getPage(this.state.getCurrentPageId(), { noError: true })?.dataset["layer"],
            0,
        )
        const layerTo = parseToNumber(this.dom.getPage(id, { noError: true })?.dataset["layer"], 0)

        this.transition(layerFrom, layerTo, id, option)
    }

    private transition(
        layerFrom: number,
        layerTo: number,
        nextPageId: string,
        { isBack, msIn = 200, msOut = 200 }: GotoOption,
    ) {
        Pages.onTransitionStart(this)

        const currentPageId = this.state.getCurrentPageId()
        const transition =
            this.transitions[currentPageId]?.[nextPageId] ?? getDefaultPageTransition(layerFrom, layerTo, msIn, msOut)

        if (layerFrom > layerTo && !isBack) {
            console.error(`下のlayerにback以外でgotoしようとした。from: ${layerFrom}, to: ${layerTo}`)
            Pages.onTransitionEnd(this)
            return
        }

        this.dom.transition(currentPageId, nextPageId, transition, layerFrom, layerTo)

        this.state.goto(nextPageId)

        Pages.onTransitionEnd(this)
    }
}

function getDefaultPageTransition(layerFrom: number, layerTo: number, msIn: number, msOut: number): TransitionArgs {
    if (layerFrom === layerTo) {
        return {
            from: [[{ opacity: 1 }, { opacity: 0 }], { duration: msOut, easing: "ease", fill: "forwards" }],
            to: [[{ opacity: 0 }, { opacity: 1 }], { duration: msIn, easing: "ease", fill: "forwards" }],
            crossFade: false,
        }
    }

    if (layerFrom < layerTo) {
        return {
            from: [[]],
            to: [[{ opacity: 0 }, { opacity: 1 }], { duration: msIn, easing: "ease", fill: "forwards" }],
            crossFade: false,
        }
    }

    return {
        from: [[{ opacity: 1 }, { opacity: 0 }], { duration: msOut, easing: "ease", fill: "forwards" }],
        to: [[]],
        crossFade: false,
    }
}
