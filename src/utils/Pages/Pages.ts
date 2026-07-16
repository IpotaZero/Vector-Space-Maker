import { Awaits } from "@ipota/functions"
import { CallbackHandler } from "../CallbackHandler"
import { PageDom } from "./PageDom"
import { PageState } from "./PageState"
import { parseToNumber } from "./parseToNumber"

export type FadeOption = { msIn: number; msOut: number }

export type GotoOption = FadeOption & {
    isBack: boolean
}

type TransitionArgs = {
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

    private animationId = 0

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

    getElement(query: string, cls = HTMLElement) {
        const element = this.dom.container.querySelector(query)

        if (element === null) {
            throw new Error("そんな要素はない。")
        }

        if (!(element instanceof cls)) {
            throw new Error(`${cls.name}でなかった。`)
        }

        return element
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
        this.animate(from, to, layerFrom, layerTo, transition)

        this.ch.run(`on-exit-${currentPageId}`, this)
        this.ch.run(`on-enter-${nextPageId}`, this)

        this.ch.run("transition-end", this)
    }

    private async animate(
        from: HTMLElement,
        to: HTMLElement,
        layerFrom: number,
        layerTo: number,
        transition: TransitionArgs,
    ) {
        let animationId = ++this.animationId

        from.getAnimations().forEach((a) => a.cancel())
        to.getAnimations().forEach((a) => a.cancel())

        const fromAnimation = transition.from({ from, to })
        // if (!transition.crossfade) await fromAnimation

        if (animationId !== this.animationId) return

        // ちらつき防止
        to.style.opacity = "0"
        await Awaits.frame()
        to.classList.remove("hidden")
        to.style.opacity = ""

        const toAnimation = transition.to({ from, to })

        await Promise.all([fromAnimation, toAnimation])

        if (animationId !== this.animationId) return

        if (layerFrom > layerTo) {
            from.classList.add("hidden")
        } else if (layerFrom < layerTo) {
            to.classList.remove("hidden")
        } else {
            from.classList.add("hidden")
            to.classList.remove("hidden")
        }
    }

    private readonly DEFAULT_IN_MS = 100
    private readonly DEFAULT_OUT_MS = 100

    private setOnclick(container: HTMLElement) {
        container.addEventListener("click", (e) => {
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
        })
    }
}

function defaultTransition(from: HTMLElement, to: HTMLElement, msIn: number, msOut: number): TransitionArgs {
    const layerFrom = parseToNumber(from?.dataset.layer, 0)
    const layerTo = parseToNumber(to?.dataset.layer, 0)

    if (layerFrom === layerTo) {
        return {
            from: async () => {
                const fromAnimation = from.animate([{ opacity: 1 }, { opacity: 0 }], {
                    duration: msOut,
                    fill: "forwards",
                })
                await fromAnimation.finished
            },
            to: async () => {
                const toAnimation = to.animate([{ opacity: 0 }, { opacity: 1 }], {
                    duration: msIn,
                    fill: "forwards",
                })
                await toAnimation.finished
            },
        }
    } else if (layerFrom < layerTo) {
        return {
            from: async () => {},
            to: async () => {
                const toAnimation = to.animate([{ opacity: 0 }, { opacity: 1 }], {
                    duration: msIn,
                    fill: "forwards",
                })
                await toAnimation.finished
            },
        }
    } else {
        return {
            from: async () => {
                const fromAnimation = from.animate([{ opacity: 1 }, { opacity: 0 }], {
                    duration: msOut,
                    fill: "forwards",
                })
                await fromAnimation.finished
            },
            to: async () => {},
        }
    }
}
