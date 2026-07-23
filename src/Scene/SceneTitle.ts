import { Dom } from "../Dom"
import { Pages } from "@ipota/pages"
import { Scene } from "../utils/Scene/Scene"
import { focuses, focusesUpdater, sc } from "../main"
import { Files } from "@ipota/functions"
import * as tiled from "@kayahr/tiled"

export class SceneTitle extends Scene {
    private pages = new Pages()

    constructor() {
        super()

        focusesUpdater(this.pages)
    }

    update() {}

    async start(): Promise<void> {
        await this.pages.loadFromFile(Dom.container, "assets/pages/title/index.html")

        this.pages.setTransition("first", "stages", {
            from: async ({ from }) => {
                await from.animate(
                    [
                        { transform: "translateX(0)", opacity: 1 },
                        { transform: "translateX(-25%)", opacity: 0 },
                    ],
                    { duration: 400, easing: "ease", fill: "forwards" },
                ).finished
            },
            to: async ({ to }) => {
                to.classList.remove("hidden")
                await to.animate(
                    [
                        { transform: "translateX(25%)", opacity: 0 },
                        { transform: "translateX(0)", opacity: 1 },
                    ],
                    { duration: 400, easing: "ease", fill: "forwards" },
                ).finished
            },
            last: async ({ from, to }) => {
                from.classList.add("hidden")
                to.classList.remove("hidden")
            },
            crossfade: true,
        })

        this.pages.setTransition("stages", "first", {
            from: async ({ from }) => {
                await from.animate(
                    [
                        { transform: "translateX(0)", opacity: 1 },
                        { transform: "translateX(25%)", opacity: 0 },
                    ],
                    { duration: 400, easing: "ease", fill: "forwards" },
                ).finished
            },
            to: async ({ to }) => {
                to.classList.remove("hidden")
                await to.animate(
                    [
                        { transform: "translateX(-25%)", opacity: 0 },
                        { transform: "translateX(0)", opacity: 1 },
                    ],
                    { duration: 400, easing: "ease", fill: "forwards" },
                ).finished
            },
            last: async ({ from, to }) => {
                from.classList.add("hidden")
                to.classList.remove("hidden")
            },
            crossfade: true,
        })

        this.pages
            .getElement("#stage-buttons")
            .insertAdjacentHTML("beforeend", `<button data-link="stage-${"test"}">${"test"}</button>`)

        focuses.setPage(this.pages.getCurrentPage())

        this.pages.beforeEnter("stage-test", async () => {
            const mapData = (await fetch(`stages/test2.tmj`).then((res) => res.json())) as tiled.Map
            console.log(mapData)

            const { SceneGame } = await import("./SceneGame")

            sc.goto(new SceneGame(mapData))
            // sc.goto(new SceneGame(args.dataset.stage!))
        })

        // this.pages.beforeEnter("download", async () => {
        //     const mapData = await fetch(`stages/test.tmj`).then((res) => res.text())
        //     Files.downLoadString(mapData, "test", "tmj")
        // })

        // this.pages.beforeEnter("load", async () => {
        //     const file = await Files.inputFile("json")
        //     if (!file) return

        //     const text = await file.text()
        //     const data = JSON.parse(text)

        //     console.log(data)

        //     sc.goto(new SceneGame(data))
        // })
    }

    async end(): Promise<void> {
        this.pages.dispose()
    }
}
