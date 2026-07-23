import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

export class GltfViewer {
    public readonly canvas: HTMLCanvasElement

    private readonly scene: THREE.Scene
    private readonly camera: THREE.PerspectiveCamera
    private readonly renderer: THREE.WebGLRenderer
    private readonly loader: GLTFLoader

    private mixer: THREE.AnimationMixer | null = null
    private currentModel: THREE.Group | null = null
    private animations: THREE.AnimationClip[] = []
    private currentAction: THREE.AnimationAction | null = null

    // ▼ クロックを追加
    private readonly timer: THREE.Timer = new THREE.Timer()
    // ▼ フレーム制御用の時間を蓄積する変数を追加
    private timeAccumulator: number = 0

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

        this.canvas = this.renderer.domElement

        // 3. DOMのスタイル設定 (ゲームキャンバスの上に絶対配置で被せる)
        this.canvas.classList.add("gltf-viewer")
        this.canvas.style.display = "none" // 初期状態は非表示

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
        this.canvas.style.display = ""

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
        this.canvas.style.display = "none"
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
            // 前のアニメーションから1秒かけてスムーズにブレンド(遷移)させる
            this.currentAction.fadeOut(1)
        }

        this.currentAction = this.mixer.clipAction(clip)
        this.currentAction.reset().fadeIn(1).play()
    }

    /** 毎フレーム呼び出す更新処理 */
    public update(): void {
        if (this.canvas.style.display === "none") {
            return
        }

        this.timer.update()
        const delta = this.timer.getDelta()

        if (this.mixer) {
            // ▼ 目標のFPSを設定（数値が小さいほどカクカクになる。12〜15あたりがレトロ風）
            const targetFPS = 10
            const frameTime = 1 / targetFPS

            // 経過時間を蓄積
            this.timeAccumulator += delta

            // 蓄積された時間が1フレーム分の時間を超えたら更新
            if (this.timeAccumulator >= frameTime) {
                // 何フレーム分進めるべきか計算
                const steps = Math.floor(this.timeAccumulator / frameTime)
                const timeToAdvance = steps * frameTime

                // アニメーションをコマ送りで進める
                this.mixer.update(timeToAdvance)

                // 消費した分の時間を減らす
                this.timeAccumulator -= timeToAdvance
            }
        }

        this.renderer.render(this.scene, this.camera)
    }
}
