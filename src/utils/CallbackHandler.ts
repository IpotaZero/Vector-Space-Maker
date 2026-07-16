/**
 * handlerの保持と実行。
 */
export class CallbackHandler<Code extends string, Arg> {
    private readonly handlers: Record<string, (args: Arg) => Promise<boolean> | void> = {}

    on(code: Code, handler: (arg: Arg) => void) {
        this.handlers[code] = handler
    }

    run(code: Code, arg: Arg) {
        const handler = this.handlers[code]

        if (!handler) return true

        return handler?.(arg)
    }
}
