import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

export class GltfViewer {
    public readonly domElement: HTMLElement

    private readonly scene: THREE.Scene
    private readonly camera: THREE.PerspectiveCamera
    private readonly renderer: THREE.WebGLRenderer
    private readonly loader: GLTFLoader

    private mixer: THREE.AnimationMixer | null = null
    private currentModel: THREE.Group | null = null
    private animations: THREE.AnimationClip[] = []
    private currentAction: THREE.AnimationAction | null = null

    // 一度読み込んだモデルを使い回すためのキャッシュ
    private readonly modelCache: Map<string, { model: THREE.Group; animations: THREE.AnimationClip[] }> = new Map()

    constructor(width: number, height: number) {
        this.scene = new THREE.Scene()

        // 1. カメラの設定 (立ち絵が映るように調整)
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
        this.camera.position.set(0, 0, 0)

        // 2. レンダラーの設定 (alpha: true で背景を透過)
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        this.renderer.setSize(width, height)
        this.renderer.setClearColor(0x000000, 0) // 完全透過

        this.domElement = this.renderer.domElement

        // 3. DOMのスタイル設定 (ゲームキャンバスの上に絶対配置で被せる)
        this.domElement.style.position = "absolute"
        this.domElement.style.height = "100%"
        this.domElement.style.width = "auto"
        this.domElement.style.pointerEvents = "none" // クリック入力を下の2Dキャンバスに貫通させる
        this.domElement.style.display = "none" // 初期状態は非表示

        // 4. ライトの設定 (GLTFモデルが暗くならないように)
        const ambientLight = new THREE.AmbientLight(0xffffff, 1)
        this.scene.add(ambientLight)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
        directionalLight.position.set(1, 1, 1).normalize()
        this.scene.add(directionalLight)

        this.loader = new GLTFLoader()
    }

    /** モデルを表示し、アニメーションを再生する */
    public async show(
        url: string,
        {
            animationName,
            scale = 1,
            p = [0, 0, 0],
            rotateY = 0,
        }: { animationName?: string; scale?: number; p?: [number, number, number]; rotateY?: number } = {},
    ): Promise<void> {
        this.domElement.style.display = "block"

        // キャッシュになければロード
        if (!this.modelCache.has(url)) {
            const gltf = await this.loader.loadAsync(url)
            this.modelCache.set(url, { model: gltf.scene, animations: gltf.animations })
        }

        const { model, animations } = this.modelCache.get(url)!

        // モデルが切り替わった場合の処理
        if (this.currentModel !== model) {
            if (this.currentModel) this.scene.remove(this.currentModel)

            this.currentModel = model
            this.scene.add(this.currentModel)

            this.currentModel.position.set(...p)
            this.currentModel.rotateY(rotateY)
            this.currentModel.scale.set(scale, scale, scale)

            this.mixer = new THREE.AnimationMixer(this.currentModel)
            this.animations = animations
        }

        this.playAnimation(animationName)
    }

    /** 立ち絵を非表示にする */
    public hide(): void {
        this.domElement.style.display = "none"
        if (this.currentAction) {
            this.currentAction.stop()
        }
    }

    /** 指定されたアニメーションを再生する */
    private playAnimation(name?: string): void {
        if (!this.mixer || this.animations.length === 0) return

        // 名前指定がなければ最初のアニメーションを使用
        let clip = name ? this.animations.find((a) => a.name === name) : this.animations[0]
        if (!clip) clip = this.animations[0]
        if (!clip) return

        if (this.currentAction) {
            // 前のアニメーションから0.2秒かけてスムーズにブレンド(遷移)させる
            this.currentAction.fadeOut(0.2)
        }

        this.currentAction = this.mixer.clipAction(clip)
        this.currentAction.reset().fadeIn(0.2).play()
    }

    /** 毎フレーム呼び出す更新処理 */
    public update(): void {
        if (this.domElement.style.display === "none") {
            return
        }

        if (this.mixer) {
            this.mixer.update(0.01)
        }

        this.renderer.render(this.scene, this.camera)
    }
}
