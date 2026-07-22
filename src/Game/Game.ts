import { Camera } from "./Camera"
import { loadStageFromMapData, loadStageFromUrl } from "./loadStageFromJson"
import { Stage } from "./Stage"
import { DigitalInput } from "@ipota/input"
import * as tiled from "@kayahr/tiled"
import { Zone } from "./movable/zone/Zone"
import { Edge } from "./movable/Edge"
import { vec } from "@ipota/vec"
import { Player } from "./Actor/Player"
import { Enemy } from "./Actor/Enemy"
import { Bullet } from "./Actor/Bullet"
import { BulletDrawer } from "./BulletDrawer"
import { BulletCollision } from "./BulletCollision"
import { remodel } from "./Remodel"
import { T } from "../T"

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

    enemies: Enemy[] = []
    bullets: Bullet[] = []

    private bulletDrawer = new BulletDrawer()
    private bulletCollision = new BulletCollision()

    constructor(
        canvas: HTMLCanvasElement,
        readonly input: DigitalInput.Reader<"right" | "left" | "jump" | "fire">,
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
        Bullet.WIDTH = this.stage.width
        Bullet.HEIGHT = this.stage.height
        this.reset()
    }

    private reset(): void {
        this.player = new Player(vec(this.stage.start.x, this.stage.start.y))
        this.camera.scale = 1.5
        this.enemies = []
        this.bullets = []
        this.gens = []
    }

    update(): void {
        this.updateMovables()
        this.handleZoneEnter()

        this.bullets.forEach((b) => b.update(this))
        this.enemies.forEach((e) => e.update(this))

        this.bullets
            .filter((b) => b.type === "enemy")
            .forEach((b) => {
                if (this.bulletCollision.isColliding(b, this.player)) {
                    this.player.life--
                }
            })

        this.bullets
            .filter((b) => b.type === "friend")
            .forEach((b) => {
                this.enemies.forEach((e) => {
                    if (this.bulletCollision.isColliding(b, e)) {
                        e.life--
                    }
                })
            })

        this.bullets = this.bullets.filter((b) => b.life > 0)
        this.enemies = this.enemies.filter((e) => e.life > 0)

        this.updatePlayer()
        this.updateCamera()
        this.restartIfOutOfBounds()
        this.updateGenerators()
        this.draw()
    }

    private updateMovables(): void {
        const stage = this.stage

        // 【変更】先に movable を update して、今フレームの位置と移動量(dp)を確定させる
        stage.movables.forEach((movable) => movable.update())
    }

    private handleZoneEnter(): void {
        const stage = this.stage

        stage.movables
            .filter((obj) => obj instanceof Zone)
            .forEach((zone) => {
                if (zone.contains(this.player.p)) {
                    const gen = zone.onEnter(this)
                    this.gens.push(gen)
                }
            })
    }

    private updatePlayer(): void {
        const stage = this.stage

        this.player.move(this.input)
        this.player.update(this)
        this.player.resolveCollisions(stage.movables.filter((obj) => obj instanceof Edge))
    }

    private updateCamera(): void {
        this.camera.update(this.player.p, this.player.g)
    }

    private restartIfOutOfBounds(): void {
        const stage = this.stage

        // ステージ外に落ちたらリスタート
        if (
            this.player.p.x < 0 ||
            this.player.p.x > stage.width ||
            this.player.p.y < 0 ||
            this.player.p.y > stage.height
        ) {
            this.reset()
        }
    }

    private updateGenerators(): void {
        this.gens = this.gens.filter((gen) => {
            const result = gen.next()

            return !result.done
        })
    }

    private draw(): void {
        const stage = this.stage
        const ctx = this.ctx

        ctx.clearRect(0, 0, WIDTH, HEIGHT)
        ctx.fillStyle = "#fcfcfc"
        ctx.fillRect(0, 0, WIDTH, HEIGHT)

        ctx.save()
        this.camera.apply(ctx, WIDTH, HEIGHT)

        for (const t of stage.movables) t.draw(ctx)
        this.player.draw(ctx)

        this.enemies.forEach((e) => e.draw(ctx))
        this.bullets.forEach((b) => this.bulletDrawer.draw(b, ctx))

        ctx.restore()
    }
}
