import { Game } from "../Game/Game"
import { Scene } from "./Scene"

export class SceneGame extends Scene {
    private game: Game

    constructor(game: Game) {
        super()
        this.game = game
    }

    async start(): Promise<void> {
        await this.game.load("stages/test.tmj")
        this.game.attach()
    }

    async end(): Promise<void> {
        this.game.detach()
    }
}
