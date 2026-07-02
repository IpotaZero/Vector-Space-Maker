import { RegExpDict } from "../RegExpDict"
import { Pages } from "./Pages"

type OnEnterHandler = (button?: HTMLButtonElement) => Promise<void> | void
type OnLeftHandler = (button?: HTMLButtonElement) => Promise<void> | void
type BeforeEnterHandler = (button?: HTMLButtonElement) => Promise<void | boolean> | boolean | void
type OnBackHandler = (button?: HTMLButtonElement) => Promise<void> | void

/**
 * handlerの保持と実行。
 */
export class PageRun {
    private readonly onEnterHandlers = new RegExpDict<OnEnterHandler>()
    private readonly onLeftHandlers = new RegExpDict<OnLeftHandler>()
    private readonly beforeEnterHandlers = new RegExpDict<BeforeEnterHandler>()
    private readonly onBackHandlers = new RegExpDict<OnBackHandler>()

    setOnEnter(selector: string, handler: OnEnterHandler) {
        this.onEnterHandlers.add(selector, handler)
    }

    setOnLeft(selector: string, handler: OnLeftHandler) {
        this.onLeftHandlers.add(selector, handler)
    }

    setBeforeEnter(selector: string, handler: BeforeEnterHandler) {
        this.beforeEnterHandlers.add(selector, handler)
    }

    setOnBack(selector: string, handler: OnBackHandler) {
        this.onBackHandlers.add(selector, handler)
    }

    onEnter(id: string, { button }: { button?: HTMLButtonElement } = {}) {
        return Promise.all(this.onEnterHandlers.getAll(id).map((handler) => handler(button)))
    }

    onLeft(id: string, { button }: { button?: HTMLButtonElement } = {}) {
        return Promise.all(this.onLeftHandlers.getAll(id).map((handler) => handler(button)))
    }

    async beforeEnter(id: string, { button }: { button?: HTMLButtonElement } = {}) {
        const result = Array.from(this.beforeEnterHandlers.getAll(id).map((handler) => handler(button)))

        if (result.length === 0) return true

        const p = await Promise.all(result)
        const canTransition = p.every(Boolean)
        return canTransition
    }

    onBack(id: string, { button }: { button?: HTMLButtonElement } = {}) {
        return Promise.all(this.onBackHandlers.getAll(id).map((handler) => handler(button)))
    }
}
