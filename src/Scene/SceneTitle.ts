import { Dom } from "../Dom"
import { Pages } from "../utils/Pages/Pages"
import { Selector } from "../utils/Selector"
import { Scene } from "../utils/Scene/Scene"
import { focuses, sc } from "../main"
import { SceneGame } from "./SceneGame"

export class SceneTitle extends Scene {
    private pages = new Pages()
    private selector

    constructor() {
        super()
        this.selector = new Selector({
            "#stage-buttons": { alias: "stages" },
        })
    }

    update() {}

    async start(): Promise<void> {
        await this.pages.loadFromFile(Dom.container, "assets/pages/title/index.html")

        this.pages.setTransition(
            "first",
            "stages",
            {
                from: [
                    [
                        { transform: "translateX(0)", opacity: 1 },
                        { transform: "translateX(-25%)", opacity: 0 },
                    ],
                    { duration: 400, easing: "ease", fill: "forwards" },
                ],
                to: [
                    [
                        { transform: "translateX(25%)", opacity: 0 },
                        { transform: "translateX(0)", opacity: 1 },
                    ],
                    { duration: 400, easing: "ease", fill: "forwards" },
                ],
            },
            { crossFade: false },
        )

        this.pages.setTransition(
            "stages",
            "first",
            {
                from: [
                    [
                        { transform: "translateX(0)", opacity: 1 },
                        { transform: "translateX(25%)", opacity: 0 },
                    ],
                    { duration: 400, easing: "ease", fill: "forwards" },
                ],
                to: [
                    [
                        { transform: "translateX(-25%)", opacity: 0 },
                        { transform: "translateX(0)", opacity: 1 },
                    ],
                    { duration: 400, easing: "ease", fill: "forwards" },
                ],
            },
            { crossFade: true },
        )

        this.selector.load(Dom.container)
        this.selector
            .getFirst("stages")
            .insertAdjacentHTML("beforeend", `<button data-stage="${"test"}">${"test"}</button>`)

        focuses.setPage(this.pages.getCurrentPage())

        this.selector.onDelegateClick("stages", "button", async (args) => {
            sc.goto(new SceneGame(args.dataset.stage!))
        })
    }

    async end(): Promise<void> {}
}
