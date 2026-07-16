import { Awaits } from "@ipota/functions"
import { RegExpDict } from "../RegExpDict"
import { Pages, type TransitionArgs } from "./Pages"

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
        if (!transition.crossfade) await fromAnimation

        if (animationId !== this.animationId) return

        // ちらつき防止
        if (layerFrom <= layerTo) {
            to.style.opacity = "0"
            await Awaits.frame()
            to.style.opacity = ""
        }

        const toAnimation = transition.to({ from, to })

        await this.waitAnimation(Promise.all([fromAnimation, toAnimation]), animationId)

        if (animationId !== this.animationId) return

        transition.last({ from, to })
    }

    private async setup(html: string, override: boolean) {
        this.container.classList.add(Pages.hiddenClass)

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
                page.classList.add(Pages.hiddenClass)
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

        this.container.classList.remove(Pages.hiddenClass)
    }

    private isCanceledAnimationError(error: unknown) {
        return error instanceof DOMException && error.name === "AbortError"
    }

    private async waitAnimation(promise: Promise<unknown>, animationId: number) {
        try {
            await promise
        } catch (error) {
            if (animationId !== this.animationId && this.isCanceledAnimationError(error)) {
                return
            }

            throw error
        }
    }
}
