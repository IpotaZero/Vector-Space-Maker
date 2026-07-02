import { Scene } from "./Scene"

export class SceneManager {
    private currentScene: Scene | undefined = undefined

    async changeScene(newScene: Scene): Promise<void> {
        if (this.currentScene) {
            await this.currentScene.end()
        }

        this.currentScene = newScene
        await this.currentScene.start()
    }
}
