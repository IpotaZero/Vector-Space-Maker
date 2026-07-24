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

    // 現在の待機（ループ）アニメーション名
    private currentIdleName: string | undefined = undefined
    // 一時アニメーション（ワンショット）を再生中かどうか
    private isPlayingOnce: boolean = false
    // 一時アニメーション終了時のmixerイベントリスナー（後片付け用）
    private onOnceFinished: ((event: { action: THREE.AnimationAction }) => void) | null = null

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
            this.currentIdleName = undefined
            this.isPlayingOnce = false
        }

        this.playIdle(animationName)
    }

    setRotationY(angle: number): void {
        if (this.currentModel) {
            this.currentModel.rotation.y = angle
        }
    }

    /** 立ち絵を非表示にする */
    public hide(): void {
        this.canvas.style.display = "none"

        if (this.currentAction) {
            this.currentAction.stop()
        }
    }

    /** 名前からアニメーションクリップを探す（見つからなければ先頭のクリップ） */
    private findClip(name?: string): THREE.AnimationClip | null {
        if (this.animations.length === 0) return null
        const clip = name ? this.animations.find((a) => a.name === name) : this.animations[0]
        return clip ?? this.animations[0] ?? null
    }

    /**
     * 待機アニメーション（無限ループ）を再生する。
     * 一時アニメーション再生中であっても、これを呼ぶと待機アニメーションに切り替わる。
     */
    public playIdle(name?: string, everyFrame?: boolean): void {
        if (!this.mixer) return
        const clip = this.findClip(name)
        if (!clip) return

        if (everyFrame && name === this.currentIdleName) {
            return
        }

        this.currentIdleName = name ?? clip.name
        this.isPlayingOnce = false
        this.cleanupOnceListener()

        this.crossFadeTo(clip, THREE.LoopRepeat)
    }

    /**
     * 一時アニメーション（ワンショット）を一度だけ再生し、終了したら
     * 自動的に現在の待機アニメーションへ戻る。
     * @param name 再生する一時アニメーションのクリップ名
     * @param onFinish 一時アニメーション終了時に呼ばれるコールバック（任意）
     */
    public playOnce(name: string, onFinish?: () => void): void {
        if (!this.mixer) return
        const clip = this.findClip(name)
        if (!clip) return

        this.cleanupOnceListener()
        this.isPlayingOnce = true

        // 一時アニメーションへは即座に切り替える（ブレンドしない）
        const action = this.crossFadeTo(clip, THREE.LoopOnce, true, 0)
        if (!action) return

        const mixer = this.mixer
        const handler = (event: { action: THREE.AnimationAction }) => {
            if (event.action !== action) return
            mixer.removeEventListener("finished", handler as any)
            this.onOnceFinished = null

            // 別の一時アニメーションに割り込まれていた場合は何もしない
            if (!this.isPlayingOnce) return

            this.isPlayingOnce = false
            onFinish?.()
            this.playIdle(this.currentIdleName)
        }

        this.onOnceFinished = handler
        mixer.addEventListener("finished", handler as any)
    }

    /** 一時アニメーション終了リスナーの後片付け */
    private cleanupOnceListener(): void {
        if (this.mixer && this.onOnceFinished) {
            this.mixer.removeEventListener("finished", this.onOnceFinished as any)
        }
        this.onOnceFinished = null
    }

    /** 指定クリップへ切り替える（fadeDurationを0にすると即座に切り替わる） */
    private crossFadeTo(
        clip: THREE.AnimationClip,
        loop: THREE.AnimationActionLoopStyles,
        clampWhenFinished: boolean = false,
        fadeDuration: number = 0.2,
    ): THREE.AnimationAction | null {
        if (!this.mixer) return null

        if (this.currentAction) {
            if (fadeDuration > 0) {
                // 前のアニメーションからスムーズにブレンド(遷移)させる
                this.currentAction.fadeOut(fadeDuration)
            } else {
                // 即座に停止（ブレンドしない）
                this.currentAction.stop()
            }
        }

        const action = this.mixer.clipAction(clip)
        action.reset()
        action.setLoop(loop, loop === THREE.LoopOnce ? 1 : Infinity)
        action.clampWhenFinished = clampWhenFinished

        if (fadeDuration > 0) {
            action.fadeIn(fadeDuration)
        } else {
            action.setEffectiveWeight(1)
        }
        action.play()

        this.currentAction = action
        return action
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

    /**
     * このインスタンスが保持する全リソースを解放する。
     * キャッシュ済みの全モデル（geometry/material/texture）とrendererを破棄する。
     * 呼び出し後、このインスタンスは再利用できない。
     */
    public dispose(): void {
        this.hide()

        // mixerの後片付け
        this.cleanupOnceListener()
        if (this.mixer) {
            this.mixer.stopAllAction()
            this.mixer.uncacheRoot(this.mixer.getRoot())
        }
        this.mixer = null
        this.currentAction = null

        // 現在表示中のモデルをシーンから除去
        if (this.currentModel) {
            this.scene.remove(this.currentModel)
            this.currentModel = null
        }
        this.animations = []

        // キャッシュ済みの全モデルのgeometry/material/textureを解放
        for (const { model } of this.modelCache.values()) {
            GltfViewer.disposeObject(model)
        }
        this.modelCache.clear()

        // rendererの解放
        this.renderer.dispose()
        this.renderer.forceContextLoss()
    }

    /** Object3Dツリーを辿ってgeometry/material/textureを解放する */
    private static disposeObject(object: THREE.Object3D): void {
        object.traverse((child) => {
            if (!(child instanceof THREE.Mesh) && !(child instanceof THREE.SkinnedMesh)) return

            child.geometry?.dispose()

            const materials = Array.isArray(child.material) ? child.material : [child.material]
            for (const material of materials) {
                if (!material) continue

                for (const key of Object.keys(material)) {
                    const value = (material as unknown as Record<string, unknown>)[key]
                    if (value instanceof THREE.Texture) {
                        value.dispose()
                    }
                }
                material.dispose()
            }
        })
    }
}
