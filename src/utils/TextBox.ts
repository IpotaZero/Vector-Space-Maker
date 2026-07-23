import { DigitalInput } from "@ipota/input"
import { GltfViewer } from "./GltfViewer"
// ※別途 Three.js を使ってGLTFを表示・管理するクラス (例: GltfViewer) を作成する想定です

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
        this.box.classList.add("fade", "text-box")
    }

    *say(texts: readonly string[], config: TalkConfig = {}) {
        for (const text of texts) {
            yield* this.saySingle(text, config)
            yield
        }
    }

    private *saySingle(text: string, config: TalkConfig) {
        this.box.classList.remove("fade")

        this.name.innerHTML = config.name ?? ""
        this.text.innerHTML = text

        yield* this.wait()

        this.box.classList.add("fade")
    }

    private *wait() {
        while (!this.input.isPushed("ok") && !this.input.isPushed("cancel")) yield
        yield
    }
}
