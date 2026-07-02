import { DigitalInputReader } from "../Input/DigitalInput"
import { FocusesGridHandler } from "./FocusesGridHandler"
import { buildGrid, hidePointerTemporarily } from "./util"

export type Operation = "right" | "left" | "up" | "down" | "ok" | "cancel"
export type Grid = readonly (readonly HTMLElement[])[]
export type FocusKey = readonly [number, number]

export class Focuses {
    private static readonly FOCUS_CLASS = "nav-focus"

    private readonly gridHandler = new FocusesGridHandler()
    private readonly ac = new AbortController()

    constructor(private readonly input: DigitalInputReader<Operation>) {
        window.addEventListener("pointerdown", this.onPointerDown, { signal: this.ac.signal })
        window.addEventListener("pointerover", this.onPointerOver, { signal: this.ac.signal })
    }

    /** ページ遷移時に呼ぶ。新しいページのDOMからグリッドを再構築する。 */
    setPage(page: HTMLElement): void {
        this.blur()
        this.gridHandler.setGrid(buildGrid(page))
        this.focus()
    }

    update() {
        this.input.isPushed("up") && this.operate("up")
        this.input.isPushed("down") && this.operate("down")
        this.input.isPushed("left") && this.operate("left")
        this.input.isPushed("right") && this.operate("right")
        this.input.isPushed("ok") && this.operate("ok")
        this.input.isPushed("cancel") && this.operate("cancel")

        if (
            (this.input.isPushed("up") ||
                this.input.isPushed("down") ||
                this.input.isPushed("left") ||
                this.input.isPushed("right") ||
                this.input.isPushed("ok") ||
                this.input.isPushed("cancel")) &&
            !this.gridHandler.hasFocus()
        ) {
            this.gridHandler.focusFirstButton()
            this.highlightButton()
        }
    }

    private operate(operation: Operation): void {
        console.log("operate", operation)

        if (operation === "up") this.gridHandler.moveRow(-1)
        else if (operation === "down") this.gridHandler.moveRow(1)
        else if (operation === "left") this.gridHandler.moveCol(-1)
        else if (operation === "right") this.gridHandler.moveCol(1)

        const element = this.gridHandler.getFocusedElement()

        if (element instanceof HTMLButtonElement) {
            if (operation === "ok") this.gridHandler.getFocusedElement()?.click()
            else if (operation === "cancel") this.gridHandler.getCancelButton()?.click()
        } else if (element instanceof HTMLSelectElement) {
            if (operation === "ok") element.showPicker()
        }

        hidePointerTemporarily()
        this.highlightButton()
    }

    private focus(): void {
        this.gridHandler.focusFirstButton()
        this.highlightButton()
    }

    private readonly onPointerDown = (e: PointerEvent): void => {
        const target = e.target
        if (target instanceof HTMLButtonElement) return

        this.gridHandler.blur()
        this.blur()
    }

    private readonly onPointerOver = (e: PointerEvent): void => {
        const target = e.target
        if (!(target instanceof HTMLButtonElement)) return
        if (target.disabled) return
        if (!target.closest(".options")) return

        this.gridHandler.focusByButton(target)
        this.highlightButton({ noScroll: true })
    }

    private blur(): void {
        this.gridHandler.getAllButtons().forEach((b) => b.classList.remove(Focuses.FOCUS_CLASS))
    }

    private highlightButton({ noScroll }: { noScroll?: boolean } = {}): void {
        this.blur()

        const current = this.gridHandler.getFocusedElement()
        if (!current) return

        current.focus({ preventScroll: true })
        current.classList.add(Focuses.FOCUS_CLASS)

        if (!noScroll) {
            current.scrollIntoView({ behavior: "smooth", block: "center" })
        }
    }
}
