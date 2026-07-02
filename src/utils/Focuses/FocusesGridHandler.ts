import { FocusKey, Grid } from "./Focuses"
import { isCancelButton } from "./util"

export class FocusesGridHandler {
    private grid: Grid = []
    private row = -1
    private col = -1

    getKeyFromButton(button: HTMLButtonElement): FocusKey | null {
        for (let r = 0; r < this.grid.length; r++) {
            for (let c = 0; c < this.grid[r].length; c++) {
                if (this.grid[r][c] === button) return [r, c]
            }
        }

        return null
    }

    hasFocus(): boolean {
        return this.row >= 0 && this.col >= 0
    }

    focusFirstButton(): void {
        this.row = 0
        this.col = 0
    }

    blur(): void {
        this.row = -1
        this.col = -1
    }

    setGrid(grid: Grid): void {
        this.grid = grid
        this.row = 0
        this.col = 0

        this.focusInput()
    }

    moveRow(delta: number): void {
        if (!this.hasFocus()) return

        const rows = this.grid.length
        if (rows === 0) return

        const r = (this.row + rows + delta) % rows

        const maxCol = this.grid[r].length - 1
        const c = Math.min(this.col, maxCol)

        this.row = r
        this.col = c

        this.focusInput()
    }

    moveCol(delta: number): void {
        if (!this.hasFocus()) return

        const e = this.getFocusedElement()

        const isTextInput = e instanceof HTMLInputElement && (e.type === "url" || e.type === "text")
        const isRangeInput = e instanceof HTMLInputElement && e.type === "range"

        if (isTextInput) {
            this.handleMoveCursor(delta, e)
        } else if (isRangeInput) {
            this.handleMoveRange(delta, e)
        } else {
            this.handleMoveCol(delta)
        }
    }

    private handleMoveCursor(delta: number, e: HTMLInputElement) {
        if (e.selectionStart !== e.selectionEnd) return

        if (delta === -1 && e.selectionStart === 0) {
            this.handleMoveCol(-1)
            return
        }

        if (delta === 1 && e.selectionStart === e.value.length) {
            this.handleMoveCol(1)
            return
        }
    }

    private handleMoveRange(delta: number, e: HTMLInputElement) {
        e.value = String(Number(e.value) + delta)
    }

    private handleMoveCol(delta: number) {
        const rows = this.grid.length
        if (rows === 0) return

        const maxCol = this.grid[this.row].length
        if (maxCol === 0) return

        const c = (this.col + maxCol + delta) % maxCol

        this.col = c

        this.focusInput()
    }

    private focusInput() {
        const e = this.getFocusedElement()

        if (!(e instanceof HTMLInputElement)) return

        e.focus()
    }

    isFocusingTextInput() {
        const e = this.getFocusedElement()
        return e instanceof HTMLInputElement && (e.type === "text" || e.type === "url")
    }

    getFocusedElement(): HTMLElement | null {
        if (!this.hasFocus()) return null
        return this.grid[this.row]?.[this.col] ?? null
    }

    getCancelButton() {
        const button = this.getAllButtons().find(isCancelButton)

        return button ?? null
    }

    getAllButtons(): HTMLElement[] {
        return this.grid.flat()
    }

    focusByButton(button: HTMLElement): void {
        for (let r = 0; r < this.grid.length; r++) {
            const c = this.grid[r].indexOf(button)
            if (c !== -1) {
                this.row = r
                this.col = c
                return
            }
        }
    }

    focusByKey([row, col]: [row: number, col: number]) {
        this.row = row
        this.col = col
    }
}
