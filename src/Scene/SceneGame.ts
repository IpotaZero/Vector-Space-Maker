import { Dom } from "../Dom"
import { Game } from "../Game/Game"
import { input, sc } from "../main"
import { Pages } from "../utils/Pages/Pages"
import { Selector } from "../utils/Selector"
import { Scene } from "../utils/Scene/Scene"
import { SceneTitle } from "./SceneTitle"
import * as tiled from "@kayahr/tiled"

export class SceneGame extends Scene {
    private game!: Game
    private pages = new Pages()
    private selector

    private readonly ac = new AbortController()

    constructor(private readonly mapData: tiled.Map) {
        super()

        this.selector = new Selector({
            "#main": { alias: "main" },
            ".retry": { alias: "retry", expectedCount: 2 },
            ".next": { alias: "next", expectedCount: 2 },
            ".resume": { alias: "resume", expectedCount: 1 },
        })
    }

    async start(): Promise<void> {
        await this.pages.loadFromFile(Dom.container, "assets/pages/game/index.html")

        this.selector.load(Dom.container)

        this.selector.onClick("retry", () => {
            sc.goto(new SceneGame(this.mapData))
        })

        this.selector.onClick("next", () => {
            sc.goto(new SceneTitle())
        })

        this.game = new Game(this.selector.getFirst("main", HTMLCanvasElement), input, () => {
            this.pages.enter("clear")
        })

        this.selector.onClick("resume", () => {
            this.pages.back(1)
        })

        await this.game.loadFromMapData(this.mapData)
    }

    update() {
        if (input.isPushed("pause")) {
            if (this.pages.getCurrentPageId() === "pause") {
                this.pages.back(1)
            } else {
                this.pages.enter("pause")
            }
        }

        if (this.pages.getCurrentPageId() === "first") {
            this.game.update()
        }
    }

    async end(): Promise<void> {
        this.ac.abort()
    }
}
