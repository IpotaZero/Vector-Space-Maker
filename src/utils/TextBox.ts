import { DigitalInput } from "@ipota/input"

export class TextBox {
    readonly element = document.createElement("div")

    constructor(private readonly input: DigitalInput.Reader<"ok" | "cancel">) {
        this.element.classList.add("fade", "text-box")
    }

    *say(texts: readonly string[]) {
        for (const text of texts) {
            yield* this.saySingle(text)
            yield
        }
    }

    private *saySingle(text: string) {
        this.element.classList.remove("fade")

        this.element.innerHTML = text
        yield* this.wait()

        this.element.classList.add("fade")
    }

    private *wait() {
        while (!this.input.isPushed("ok")) yield
        yield
    }
}
