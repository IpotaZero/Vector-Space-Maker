import { Awaits } from "@ipota/functions"
import { RegExpDict } from "../RegExpDict"
import type { TransitionArgs } from "./Pages"

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

    async animate(from: HTMLElement, to: HTMLElement, layerFrom: number, layerTo: number, transition: TransitionArgs) {
        const animationId = ++this.animationId

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
}
