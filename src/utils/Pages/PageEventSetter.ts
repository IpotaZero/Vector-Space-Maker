import { FadeOption, GotoOption, parseToNumber } from "./Pages"

type OnclickHandlers = {
    enter: (id: string, option: GotoOption) => void
    back: (depth: number, option: GotoOption) => void
}

/**
 * linkやbackがクリックされたときのメソッドを設定する。
 */
export class PageEventSetter {
    private static readonly DEFAULT_IN_MS = 100
    private static readonly DEFAULT_OUT_MS = 100

    static setOnclick(container: HTMLElement, { enter, back }: OnclickHandlers) {
        Array.from(container.querySelectorAll("[data-link]"))
            .filter((e) => e instanceof HTMLButtonElement)
            .forEach((button) => {
                const id = button.dataset.link || "first"
                const msIn = parseToNumber(button.dataset["msIn"], this.DEFAULT_IN_MS)
                const msOut = parseToNumber(button.dataset["msOut"], this.DEFAULT_OUT_MS)

                button.addEventListener("click", () => enter(id, { button, msIn, msOut }))
            })

        Array.from(container.querySelectorAll("[data-back]"))
            .filter((e) => e instanceof HTMLButtonElement)
            .forEach((button) => {
                const depth = parseToNumber(button.dataset["back"], 1)
                const msIn = parseToNumber(button.dataset["msIn"], this.DEFAULT_IN_MS)
                const msOut = parseToNumber(button.dataset["msOut"], this.DEFAULT_OUT_MS)

                button.addEventListener("click", () => back(depth, { button, msIn, msOut }))
            })
    }
}
