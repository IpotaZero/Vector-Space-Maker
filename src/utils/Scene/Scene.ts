export abstract class Scene {
    abstract start(): Promise<void>
    abstract end(): Promise<void>

    abstract update(): void
}
