import { Dom } from "./Dom.js"
import { SceneManager } from "./Scene/SceneManager.js"
import { SceneTitle } from "./Scene/SceneTitle.js"

Dom.init()

export const sm = new SceneManager()
sm.changeScene(new SceneTitle())
