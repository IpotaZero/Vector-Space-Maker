import { Awaits } from "../Functions/Awaits"
import { Transition } from "../Functions/Transition"
import { RegExpDict } from "../RegExpDict"
import { FadeOption } from "./Pages"

/**
 * domのセットアップ、保持、フェードを行う。
 */
export class PageDom {
    readonly container: HTMLElement
    private readonly pages = new RegExpDict<HTMLElement>({})
    private readonly gotoable = new Set<string>()

    readonly ready

    constructor(container: HTMLElement, html: string, override: boolean) {
        // Initialize container
        this.container = container
        this.ready = this.setup(html, override)
    }

    isGotoable(pageId: string) {
        return this.gotoable.has(pageId)
    }

    async fadeOut(currentPageId: string, { msOut }: FadeOption = {}) {
        const from = this.getPage(currentPageId)

        await Transition.fadeOut(this.getPage(currentPageId), msOut)
        from.classList.add("hidden")
    }

    async fadeIn(nextPageId: string, { msIn }: FadeOption = {}) {
        const to = this.getPage(nextPageId)

        to.classList.remove("hidden")
        await Transition.fadeIn(this.getPage(nextPageId), msIn)
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
        this.container.style.display = "none"

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

                if (page.hasAttribute("data-gotoable")) {
                    this.gotoable.add(page.id)
                }
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

        this.container.style.display = ""
    }
}
