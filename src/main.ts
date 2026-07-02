import { Game } from "./Game/Game.js"
import { SceneGame } from "./Scene/SceneGame.js"
import { SceneManager } from "./Scene/SceneManager.js"

const sm = new SceneManager()

// --- エントリーポイント ---
const canvas = document.getElementById("main") as HTMLCanvasElement

sm.changeScene(new SceneGame(new Game(canvas)))
