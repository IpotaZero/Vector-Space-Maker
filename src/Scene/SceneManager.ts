import { Dom } from "../Dom"
import { Transition } from "../utils/Functions/Transition"
import { Scene } from "./Scene"

export class SceneManager {
    private currentScene: Scene | undefined = undefined

    async changeScene(newScene: Scene): Promise<void> {
        await Transition.fadeOut(Dom.container, 200)

        if (this.currentScene) {
            await this.currentScene.end()
        }

        this.currentScene = newScene
        await this.currentScene.start()

        await Transition.fadeIn(Dom.container, 200)
    }
}
