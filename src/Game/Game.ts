import { Camera } from "./Camera"
import { loadStageFromMapData, loadStageFromUrl } from "./loadStageFromJson"
import { Player } from "./Player"
import { Stage } from "./Stage"
import { vec } from "../utils/Vec"
import { DigitalInputReader } from "@ipota/input"
import * as tiled from "@kayahr/tiled"
import { Zone } from "./movable/zone/Zone"
import { Edge } from "./movable/Edge"

const WIDTH = 1200
const HEIGHT = 900

/**
 * ゲーム本体をカプセル化したクラス。
 * attach() / detach() でイベントリスナーの登録・解除とループの開始・停止を切り替えられる。
 * (例: SPAでの画面遷移や、複数キャンバスの切り替えなどに対応するため)
 */
export class Game {
    private readonly canvas: HTMLCanvasElement
    private readonly ctx: CanvasRenderingContext2D

    private stage!: Stage
    player!: Player
    camera!: Camera

    private gens: Generator[] = []

    constructor(
        canvas: HTMLCanvasElement,
        private readonly input: DigitalInputReader<"right" | "left" | "jump">,
        readonly onFinish: () => void,
    ) {
        this.canvas = canvas
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("2D context is not available")
        this.ctx = ctx

        this.canvas.width = WIDTH
        this.canvas.height = HEIGHT
    }

    /** ステージを読み込み、初期状態をセットアップする */
    async loadFromMapData(mapData: tiled.Map): Promise<void> {
        this.stage = await loadStageFromMapData(mapData)
        this.camera = new Camera(vec(this.stage.start.x, this.stage.start.y))
        this.reset()
    }

    private reset(): void {
        this.player = new Player(vec(this.stage.start.x, this.stage.start.y))
        this.camera.scale = 1.5
        this.gens = []
    }

    update(): void {
        const stage = this.stage

        // 【変更】先に movable を update して、今フレームの位置と移動量(dp)を確定させる
        stage.movables.forEach((movable) => movable.update())

        stage.movables
            .filter((obj) => obj instanceof Zone)
            .forEach((zone) => {
                if (zone.contains(this.player.p)) {
                    const gen = zone.onEnter(this)
                    this.gens.push(gen)
                }
            })

        this.player.move(this.input)
        this.player.update()
        this.player.resolveCollisions(stage.movables.filter((obj) => obj instanceof Edge))

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

        for (const t of stage.movables) t.draw(ctx)
        this.player.draw(ctx)

        ctx.restore()
    }
}
