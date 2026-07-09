import { Awaits } from "@ipota/functions"
import { RegExpDict } from "../RegExpDict"
import { TransitionArgs } from "./Pages"

/**
 * domのセットアップ、保持、フェードを行う。
 */
export class PageDom {
    readonly container: HTMLElement
    private readonly pages = new RegExpDict<HTMLElement>({})

    readonly ready

    private animationId = 0

    constructor(container: HTMLElement, html: string, override: boolean) {
        // Initialize container
        this.container = container
        this.ready = this.setup(html, override)
    }

    async transition(
        currentPageId: string,
        nextPageId: string,
        transition: TransitionArgs,
        layerFrom: number,
        layerTo: number,
    ) {
        const animationId = ++this.animationId

        const from = this.getPage(currentPageId)
        const to = this.getPage(nextPageId)

        from.getAnimations().forEach((a) => a.cancel())
        to.getAnimations().forEach((a) => a.cancel())

        const animationFrom = from.animate(transition.from[0], transition.from[1])

        if (!transition.crossFade) {
            await this.waitAnimation(animationFrom, animationId)

            if (animationId !== this.animationId) return
        }

        to.style.opacity = "0"
        await Awaits.frame()
        to.classList.remove("hidden")
        to.style.opacity = ""

        const animationTo = to.animate(transition.to[0], transition.to[1])

        await Promise.all([
            this.waitAnimation(animationFrom, animationId),
            this.waitAnimation(animationTo, animationId),
        ])

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

    getPage(pageId: string, option: { noError: true }): HTMLElement | undefined
    getPage(pageId: string, option?: { noError?: false }): HTMLElement
    getPage(pageId: string, option: { noError?: boolean } = {}) {
        const page = this.pages.get(pageId)

        if (option.noError) {
            return page
        }

        if (!page) {
            throw new Error("存在しないページを得ようとした。")
        }

        return page
    }

    getAllPages(pageId: string) {
        return this.pages.getAll(pageId)
    }

    private async setup(html: string, override: boolean) {
        this.container.classList.add("hidden")

        if (override) {
            this.container.innerHTML = html
        } else {
            this.container.insertAdjacentHTML("beforeend", html)
        }

        // Initialize pages
        Array.from(this.container.querySelectorAll(".page"))
            .filter((e) => e instanceof HTMLElement)
            .forEach((page) => {
                this.pages.add(page.id, page)
                page.classList.add("hidden")
            })

        const load = Promise.all([
            Awaits.waitCSSLoad(this.container),
            Awaits.waitElementReady(this.container),
            //
        ])

        const result = await Awaits.timeout(1000, load)
        if (result === "timeout") {
            console.warn("pageの読み込みに時間掛かり過ぎ! スキップしました。")
        }

        this.container.classList.remove("hidden")
    }

    private isCanceledAnimationError(error: unknown) {
        return error instanceof DOMException && error.name === "AbortError"
    }

    private async waitAnimation(animation: Animation, animationId: number) {
        try {
            await animation.finished
        } catch (error) {
            if (animationId !== this.animationId && this.isCanceledAnimationError(error)) {
                return
            }

            throw error
        }
    }
}
