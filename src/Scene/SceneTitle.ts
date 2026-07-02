import JSZip from "jszip"
import { Dom } from "../Dom"
import { Game } from "../Game/Game"
import { Pages } from "../utils/Pages/Pages"
import { Selector } from "../utils/Selector"
import { Scene } from "./Scene"
import { sm } from "../main"
import { SceneGame } from "./SceneGame"

export class SceneTitle extends Scene {
    private pages = new Pages()
    private selector

    constructor() {
        super()
        this.selector = new Selector({
            "#stages": { alias: "stages" },
        })
    }

    async start(): Promise<void> {
        await this.pages.loadFromFile(Dom.container, "assets/pages/title/index.html")

        this.selector.load(Dom.container)
        this.selector
            .getFirst("stages")
            .insertAdjacentHTML("beforeend", `<button data-stage="${"test"}">${"test"}</button>`)

        this.selector.onDelegateClick("stages", "button", async (args) => {
            sm.changeScene(new SceneGame(args.dataset.stage!))
        })
    }

    async end(): Promise<void> {}
}
