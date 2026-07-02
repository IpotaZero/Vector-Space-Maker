import { PageDom } from "./PageDom"
import { PageEventSetter } from "./PageEventSetter"
import { PageRun } from "./PageRun"
import { PageState } from "./PageState"

export type FadeOption = Partial<{ msIn: number; msOut: number }>
export type GotoOption = FadeOption & {
    button?: HTMLButtonElement
    back?: boolean
}

type LoadOption = Partial<{ history: readonly string[]; override: boolean }>

/**
 * Pages <- Dom, Run, State, EventSetter
 */

export class Pages {
    private static cache = new Map<string, string>()

    private dom!: PageDom
    private state!: PageState

    private isLoaded = false

    private readonly run = new PageRun()
    onEnter = this.run.setOnEnter.bind(this.run)
    onLeft = this.run.setOnLeft.bind(this.run)
    beforeEnter = this.run.setBeforeEnter.bind(this.run)
    onBack = this.run.setOnBack.bind(this.run)

    static onTransitionStart = (pages: Pages) => {}
    static onTransitionEnd = (pages: Pages) => {}

    getHistory() {
        return this.state.getHistory()
    }

    async loadFromFile(
        container: HTMLElement,
        path: string,
        options: LoadOption = {},
    ) {
        if (!Pages.cache.has(path)) {
            const html = await fetch(path).then((res) => res.text())
            Pages.cache.set(path, html)
        }

        await this.load(container, Pages.cache.get(path)!, options)
    }

    async load(
        container: HTMLElement,
        html: string,
        { history, override = true }: LoadOption = {},
    ) {
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
        this.isLoaded = true
    }

    getPage(pageId: string, option: { noError: true }): HTMLElement | undefined
    getPage(pageId: string, option?: { noError?: false }): HTMLElement
    getPage(pageId: string, option: { noError?: boolean } = {}) {
        if (option.noError) {
            return this.dom.getPage(pageId, { noError: true })
        } else {
            return this.dom.getPage(pageId)
        }
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

    async back(depth: number, option: FadeOption = {}) {
        this.run.onBack(this.state.currentPageId)
        await this.goto(
            this.state.back(depth),
            Object.assign(option, { back: true }),
        )
    }

    async enter(id: string, option: FadeOption = {}) {
        await this.goto(id, Object.assign(option, { back: false }))
    }

    private async goto(id: string, option: GotoOption) {
        // pages.gotoで直接来た奴
        if (!this.dom.isGotoable(id) && !option.button && this.isLoaded) {
            console.error(id)
            throw new Error(
                "このページはボタン以外から来ることを禁じられている。pageにdata-gotoableを付ける事を考えよ。",
            )
        }

        // 0. 遷移中に別の遷移が発生しないように
        if (this.state.isTransitioning()) return
        this.state.startTransition()
        Pages.onTransitionStart(this)

        // 1. 遷移可能かチェック（ガード節）
        const canTransition = await this.run.beforeEnter(id, option)
        if (!canTransition) {
            this.state.endTransition()
            Pages.onTransitionEnd(this)
            return
        }

        // layerに応じて場合分け
        const layerFrom = parseToNumber(
            this.dom.getPage(this.state.currentPageId).dataset["layer"],
            0,
        )
        const layerTo = parseToNumber(this.dom.getPage(id).dataset["layer"], 0)

        await this.transition(layerFrom, layerTo, id, option)

        // 5. 遷移完了
        this.state.endTransition()
    }

    private async transition(
        layerFrom: number,
        layerTo: number,
        id: string,
        { button, msIn, msOut, back }: GotoOption,
    ) {
        if (layerFrom === layerTo) {
            // 2. 現在のページを去る
            await this.dom.fadeOut(this.state.currentPageId, { msOut })
            await this.run.onLeft(this.state.currentPageId, { button })

            // 3. 状態の更新
            this.state.goto(id)

            // 4. 新しいページに入る
            await this.run.onEnter(id, { button })

            Pages.onTransitionEnd(this)
            await this.dom.fadeIn(id, { msIn })
        } else if (layerFrom < layerTo) {
            this.state.goto(id)

            await this.run.onEnter(id, { button })
            Pages.onTransitionEnd(this)
            await this.dom.fadeIn(id, { msIn })
        } else {
            if (!back)
                throw new Error("下のlayerにback以外でgotoしようとした。")

            await this.dom.fadeOut(this.state.currentPageId, { msOut })
            await this.run.onLeft(this.state.currentPageId, { button })

            this.state.goto(id)

            await this.run.onEnter(id, { button })
            Pages.onTransitionEnd(this)
        }
    }
}

export function parseToNumber(
    str: string | undefined | null,
    defaultValue: number,
) {
    if (!str) return defaultValue

    if (Number.isNaN(Number(str))) return defaultValue

    return Number(str)
}
