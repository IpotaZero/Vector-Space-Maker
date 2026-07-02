import { Dom } from "../Dom"
import { Game } from "../Game/Game"
import { sm } from "../main"
import { Pages } from "../utils/Pages/Pages"
import { Selector } from "../utils/Selector"
import { Scene } from "./Scene"
import { SceneTitle } from "./SceneTitle"

export class SceneGame extends Scene {
    private game!: Game
    private pages = new Pages()
    private selector

    private readonly ac = new AbortController()

    constructor(private readonly stagePath: string) {
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
            sm.changeScene(new SceneGame(this.stagePath))
        })

        this.selector.onClick("next", () => {
            sm.changeScene(new SceneTitle())
        })

        this.game = new Game(this.selector.getFirst("main", HTMLCanvasElement), () => {
            this.game.pause()
            this.pages.enter("clear")
        })

        window.addEventListener(
            "keydown",
            (e) => {
                if (e.code === "Escape") {
                    if (this.pages.getCurrentPageId() === "pause") {
                        this.pages.back(1)
                        this.game.start()
                    } else {
                        this.game.pause()
                        this.pages.enter("pause")
                    }
                }
            },
            { signal: this.ac.signal },
        )

        this.selector.onClick("resume", () => {
            this.pages.back(1)
            this.game.start()
        })

        await this.game.load(`stages/${this.stagePath}.tmj`)
        this.game.start()
    }

    async end(): Promise<void> {
        this.game.pause()
        this.ac.abort()
    }
}
