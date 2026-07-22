import { DigitalInput } from "@ipota/input"

export class TextBox {
    readonly element = document.createElement("div")

    constructor(private readonly input: DigitalInput.Reader<"ok" | "cancel">) {
        this.element.classList.add("fade", "text-box")
    }

    *say(texts: readonly string[]) {
        this.element.classList.remove("fade")

        for (const text of texts) {
            yield* this.saySingle(text)
        }

        this.element.classList.add("fade")
    }

    private *saySingle(text: string) {
        this.element.innerText = text
        yield* this.wait()
    }

    private *wait() {
        while (!this.input.isPushed("ok")) yield
    }
}
