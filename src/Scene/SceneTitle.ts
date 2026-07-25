import { Dom } from "../Dom"
import { Pages } from "@ipota/pages"
import { Scene } from "../utils/Scene/Scene"
import { focuses, focusesUpdater, sc } from "../main"
import { GltfViewer } from "../utils/GltfViewer"
import { T } from "../T"

export class SceneTitle extends Scene {
    private pages = new Pages()
    private gltfViewer = new GltfViewer(window.innerWidth, window.innerHeight)

    constructor() {
        super()

        focusesUpdater(this.pages)
    }

    update() {
        this.gltfViewer.update()
    }

    async start(): Promise<void> {
        await this.pages.loadFromFile(Dom.container, "assets/pages/title/index.html")

        this.pages.getPage("first").appendChild(this.gltfViewer.canvas)
        this.gltfViewer.show("assets/3d/Hare.glb", {
            animationName: "wait",
            scale: 3,
            p: [2, -1, -5],
            rotateY: T / 2,
        })

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

        const stages = ["Tutorial", "Test"]

        stages.forEach((stage) => {
            this.pages
                .getElement("#stage-buttons")
                .insertAdjacentHTML("beforeend", `<button data-link="stage-${stage}">${stage}</button>`)

            this.pages.beforeEnter(`stage-${stage}`, async () => {
                sc.goto(async () => {
                    // @ts-ignore
                    const modules = import.meta.glob("../Stage/*")
                    const url = `../Stage/Stage${stage}.ts`
                    const cls = await modules[url]()
                    const { SceneGame } = await import("./SceneGame")
                    return new SceneGame(new cls.default())
                })
            })
        })

        focuses.setPage(this.pages.getCurrentPage())

        this.pages.beforeEnter("records", async () => {
            alert("notimplemented")
        })

        this.pages.beforeEnter("settings", async () => {
            alert("notimplemented")
        })

        this.pages.beforeEnter("credits", async () => {
            alert("notimplemented")
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
        this.gltfViewer.dispose()
    }
}
