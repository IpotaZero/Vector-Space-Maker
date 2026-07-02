import { Dom } from "../Dom"
import { Game } from "../Game/Game"
import { Pages } from "../utils/Pages/Pages"
import { Selector } from "../utils/Selector"
import { Scene } from "./Scene"

export class SceneGame extends Scene {
    private game!: Game
    private pages = new Pages()
    private selector

    constructor(private readonly stagePath: string) {
        super()

        this.selector = new Selector({
            "#main": { alias: "main" },
        })
    }

    async start(): Promise<void> {
        await this.pages.loadFromFile(Dom.container, "assets/pages/game/index.html")

        this.selector.load(Dom.container)

        this.game = new Game(this.selector.getFirst("main", HTMLCanvasElement))

        await this.game.load(`stages/${this.stagePath}.tmj`)
        this.game.start()
    }

    async end(): Promise<void> {
        this.game.pause()
    }
}
