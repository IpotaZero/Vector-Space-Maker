import { Dom } from "../Dom"
import { Pages } from "../utils/Pages/Pages"
import { Selector } from "../utils/Selector"
import { Scene } from "../utils/Scene/Scene"
import { focuses, sc } from "../main"
import { SceneGame } from "./SceneGame"
import { Awaits } from "../utils/Functions/Awaits"
import * as tiled from "@kayahr/tiled"
import { downLoadString } from "../utils/Functions/downLoadString"

export class SceneTitle extends Scene {
    private pages = new Pages()
    private selector

    constructor() {
        super()
        this.selector = new Selector({
            "#stage-buttons": { alias: "stages" },
            ".download": { alias: "download" },
            ".load": { alias: "load" },
        })
    }

    update() {}

    async start(): Promise<void> {
        await this.pages.loadFromFile(Dom.container, "assets/pages/title/index.html")

        this.pages.setTransition("first", "stages", {
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
            crossFade: true,
        })

        this.pages.setTransition("stages", "first", {
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
            crossFade: true,
        })

        this.selector.load(Dom.container)
        this.selector
            .getFirst("stages")
            .insertAdjacentHTML("beforeend", `<button data-stage="${"test"}">${"test"}</button>`)

        focuses.setPage(this.pages.getCurrentPage())

        this.selector.onDelegateClick("stages", "button", async (args) => {
            const mapData = (await fetch(`stages/${args.dataset.stage}.tmj`).then((res) => res.json())) as tiled.Map
            console.log(mapData)
            sc.goto(new SceneGame(mapData))
            // sc.goto(new SceneGame(args.dataset.stage!))
        })

        this.selector.onClick("download", async () => {
            const mapData = await fetch(`stages/test.tmj`).then((res) => res.text())

            downLoadString(mapData, "test", "tmj")
        })

        this.selector.onClick("load", async () => {
            const file = await Awaits.inputFile("json")
            if (!file) return

            const text = await file.text()
            const data = JSON.parse(text)

            console.log(data)

            sc.goto(new SceneGame(data))
        })
    }

    async end(): Promise<void> {}
}
