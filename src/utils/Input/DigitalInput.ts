export type DigitalInputReader<Action extends string> = {
    isPressed(action: Action): boolean
    isReleased(action: Action): boolean
    isPushed(action: Action): boolean
}

export class DigitalInput<Action extends string> {
    readonly pressed = new Set<Action>()
    readonly released = new Set<Action>()
    readonly pushed = new Set<Action>()

    private readonly ac = new AbortController()

    private readonly disableReasons = new Set<string>()
    private readonly config = new Map<Action, string[]>()
    private readonly codeToActions = new Map<string, Action[]>()

    pause(reason: string): void {
        this.disableReasons.add(reason)
        this.pressed.clear()
        this.released.clear()
        this.pushed.clear()
    }

    resume(reason: string): void {
        this.disableReasons.delete(reason)
    }

    constructor(config: Map<Action, readonly string[]> | Record<Action, readonly string[]>) {
        const entries = config instanceof Map ? config.entries() : Object.entries(config)

        for (const [action, codes] of entries as Iterable<[Action, readonly string[]]>) {
            this.config.set(action, [...codes])

            for (const code of codes) {
                const actions = this.codeToActions.get(code) ?? []
                actions.push(action)
                this.codeToActions.set(code, actions)
            }
        }

        window.addEventListener("keydown", this.onKeyDown, { signal: this.ac.signal })
        window.addEventListener("keyup", this.onKeyUp, { signal: this.ac.signal })
    }

    update() {
        this.pushed.clear()
        this.released.clear()

        if (this.disableReasons.size > 0) {
            return
        }

        navigator.getGamepads()?.forEach((gamepad) => {
            if (!gamepad) return

            gamepad.buttons.forEach((button, index) => {
                const actions = this.codeToActions.get(`gamepad-button-${index}`)
                if (!actions) return

                if (button.pressed) {
                    this.press(actions)
                } else {
                    this.release(actions)
                }
            })

            gamepad.axes.forEach((axis, index) => {
                const actionPositive = this.codeToActions.get(`gamepad-axis-${index}-positive`)
                const actionNegative = this.codeToActions.get(`gamepad-axis-${index}-negative`)
                if (!actionPositive && !actionNegative) return

                if (axis > 0.5) {
                    if (actionPositive) {
                        this.press(actionPositive)
                    }

                    if (actionNegative) {
                        this.release(actionNegative)
                    }
                } else if (axis < -0.5) {
                    if (actionNegative) {
                        this.press(actionNegative)
                    }

                    if (actionPositive) {
                        this.release(actionPositive)
                    }
                } else {
                    if (actionPositive) {
                        this.release(actionPositive)
                    }
                    if (actionNegative) {
                        this.release(actionNegative)
                    }
                }
            })
        })
    }

    isPressed(action: Action): boolean {
        return this.pressed.has(action)
    }

    isReleased(action: Action): boolean {
        return this.released.has(action)
    }

    isPushed(action: Action): boolean {
        return this.pushed.has(action)
    }

    private onKeyDown = (e: KeyboardEvent) => {
        if (this.disableReasons.size > 0) return

        const actions = this.codeToActions.get(e.code)
        if (!actions) return

        this.press(actions)
    }

    private onKeyUp = (e: KeyboardEvent) => {
        if (this.disableReasons.size > 0) return

        const actions = this.codeToActions.get(e.code)
        if (!actions) return

        this.release(actions)
    }

    private press(actions: Action[]) {
        actions.forEach((action) => {
            if (!this.pressed.has(action)) {
                this.pushed.add(action)
            }
            this.pressed.add(action)
        })
    }

    private release(actions: Action[]) {
        actions.forEach((action) => {
            if (this.pressed.has(action)) {
                this.released.add(action)
            }
            this.pressed.delete(action)
        })
    }
}
