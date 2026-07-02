import { Camera } from "./Camera"
import { loadStageFromJson } from "./loadStageFromJson"
import { Input, Player } from "./Player"
import { Stage } from "./Stage"
import { vec } from "../utils/Vec"

const WIDTH = 900
const HEIGHT = 600

const KEY_MAP: Record<string, keyof Input> = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "jump",
    Space: "jump",
}

/**
 * ゲーム本体をカプセル化したクラス。
 * attach() / detach() でイベントリスナーの登録・解除とループの開始・停止を切り替えられる。
 * (例: SPAでの画面遷移や、複数キャンバスの切り替えなどに対応するため)
 */
export class Game {
    private readonly canvas: HTMLCanvasElement
    private readonly ctx: CanvasRenderingContext2D

    private stage!: Stage
    private player!: Player
    private camera!: Camera

    private readonly input: Input = { left: false, right: false, jump: false }
    private gens: Generator<void, void, unknown>[] = []

    private rafId: number | null = null
    private attached = false

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("2D context is not available")
        this.ctx = ctx

        this.canvas.width = WIDTH
        this.canvas.height = HEIGHT

        // イベントリスナーの着脱に使うため bind して保持する
        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.handleKeyUp = this.handleKeyUp.bind(this)
        this.loop = this.loop.bind(this)
    }

    /** ステージを読み込み、初期状態をセットアップする */
    async load(stagePath: string): Promise<void> {
        this.stage = await loadStageFromJson(stagePath)
        this.camera = new Camera(vec(this.stage.start.x, this.stage.start.y))
        this.reset()
    }

    /** イベントリスナーの登録とゲームループの開始 */
    start(): void {
        if (this.attached) return
        this.attached = true
        window.addEventListener("keydown", this.handleKeyDown)
        window.addEventListener("keyup", this.handleKeyUp)
        this.rafId = requestAnimationFrame(this.loop)
    }

    /** イベントリスナーの解除とゲームループの停止 */
    pause(): void {
        if (!this.attached) return
        this.attached = false
        window.removeEventListener("keydown", this.handleKeyDown)
        window.removeEventListener("keyup", this.handleKeyUp)
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId)
            this.rafId = null
        }
    }

    private reset(): void {
        this.player = new Player(vec(this.stage.start.x, this.stage.start.y))
        this.camera.scale = 1
        this.gens = []
    }

    private handleKeyDown(e: KeyboardEvent): void {
        const key = KEY_MAP[e.code]
        if (key) {
            this.input[key] = true
            e.preventDefault()
        }
        if (e.code === "KeyR") {
            this.reset()
        }
    }

    private handleKeyUp(e: KeyboardEvent): void {
        const key = KEY_MAP[e.code]
        if (key) {
            this.input[key] = false
            e.preventDefault()
        }
    }

    private loop(): void {
        const stage = this.stage

        stage.zones.forEach((zone) => {
            if (zone.contains(this.player.p)) {
                const gen = zone.onEnter({ player: this.player, camera: this.camera })
                this.gens.push(gen)
            }
        })

        this.player.update()

        for (const e of stage.edges) this.player.touchWith(e)

        this.player.move(this.input)

        this.camera.update(this.player.p, this.player.g)

        // ステージ外に落ちたらリスタート
        if (
            this.player.p.x < 0 ||
            this.player.p.x > stage.width ||
            this.player.p.y < 0 ||
            this.player.p.y > stage.height
        ) {
            this.reset()
        }

        this.gens = this.gens.filter((gen) => {
            const result = gen.next()
            return !result.done
        })

        const ctx = this.ctx
        ctx.clearRect(0, 0, WIDTH, HEIGHT)
        ctx.fillStyle = "#fcfcfc"
        ctx.fillRect(0, 0, WIDTH, HEIGHT)

        ctx.save()
        this.camera.apply(ctx, WIDTH, HEIGHT)

        for (const t of stage.texts) t.draw(ctx)
        for (const z of stage.zones) z.draw(ctx)
        for (const e of stage.edges) e.draw(ctx)
        this.player.draw(ctx)

        ctx.beginPath()
        ctx.fillStyle = "#000"
        ctx.arc(stage.goal.x, stage.goal.y, stage.goal.r, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()

        if (this.attached) {
            this.rafId = requestAnimationFrame(this.loop)
        }
    }
}
