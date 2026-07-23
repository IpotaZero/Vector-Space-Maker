import { DigitalInput } from "@ipota/input"

export interface TalkConfig {
    name?: string
}

export class TextBox {
    readonly box = document.createElement("div")
    private readonly name: HTMLElement
    private readonly text: HTMLElement

    constructor(private readonly input: DigitalInput.Reader<"ok" | "cancel">) {
        this.box.innerHTML = `
            <div class="name"></div>
            <div class="text"></div>
        `
        this.name = this.box.querySelector(".name") as HTMLElement
        this.text = this.box.querySelector(".text") as HTMLElement
        this.box.classList.add("hidden", "text-box")
    }

    *say(texts: readonly string[], config: TalkConfig = {}) {
        for (const text of texts) {
            yield* this.saySingle(text, config)
            yield
        }
    }

    private *saySingle(text: string, config: TalkConfig) {
        this.name.innerHTML = config.name ?? ""
        this.text.innerHTML = text

        this.box.classList.remove("hidden")

        yield* this.wait()

        this.box.classList.add("hidden")
    }

    private *wait() {
        while (!this.input.isPushed("ok") && !this.input.isPushed("cancel")) yield
        yield
    }
}
