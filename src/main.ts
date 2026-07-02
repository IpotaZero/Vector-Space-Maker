import { Game } from "./Game/Game.js"

// --- エントリーポイント ---
const canvas = document.getElementById("main") as HTMLCanvasElement
const game = new Game(canvas)
await game.load("stages/test.tmj")
game.attach()
