import { Dom } from "../Dom"
import { Game } from "../Game/Game"
import { focuses, focusesUpdater, sc } from "../main"
import { input } from "../input"
import { Pages } from "@ipota/pages"
import { Scene } from "../utils/Scene/Scene"
import * as tiled from "@kayahr/tiled"

export class SceneGame extends Scene {
    private game!: Game
    private pages = new Pages()

    constructor(private readonly mapData: tiled.Map) {
        super()

        focusesUpdater(this.pages)
    }

    async start(): Promise<void> {
        await this.pages.loadFromFile(Dom.container, "assets/pages/game/index.html")

        this.pages.beforeEnter("retry", async () => {
            sc.goto(new SceneGame(this.mapData))
        })

        this.pages.beforeEnter("next", async () => {
            const { SceneTitle } = await import("./SceneTitle")
            sc.goto(new SceneTitle())
        })

        this.game = new Game(this.pages.getElement("#main", HTMLCanvasElement), input, () => {
            this.pages.enter("clear")
        })

        this.pages.beforeEnter("resume", () => {
            this.pages.back(1)
        })

        Dom.container.appendChild(this.game.textBox.box)
        Dom.container.appendChild(this.game.gltfViewer.canvas)

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
        this.pages.dispose()
        this.game.dispose()
    }
}
