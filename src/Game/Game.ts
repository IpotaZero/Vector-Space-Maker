import { Camera } from "./Camera"
import { loadStageFromMapData, loadStageFromUrl } from "./loadStageFromJson"
import { Stage } from "./Stage"
import { DigitalInput } from "@ipota/input"
import * as tiled from "@kayahr/tiled"
import { Zone } from "./movable/zone/Zone"
import { Edge } from "./movable/Edge"
import { Vec, vec } from "@ipota/vec"
import { Player } from "./Actor/Player"
import { Enemy } from "./Actor/Enemy"
import { Bullet } from "./Actor/Bullet"
import { BulletDrawer } from "./BulletDrawer"
import { BulletCollision } from "./BulletCollision"
import { EnemyTest } from "../Enemy/EnemyTest"
import { Ctx } from "../utils/Functions/Ctx"
import { TextBox } from "../utils/TextBox"
import { GameNode } from "./GameNode"

const WIDTH = 32 * 40
const HEIGHT = 32 * 24

export type GameLike = {
    player: Player
    enemies: Enemy[]
    bullets: Bullet[]
    input: DigitalInput.Reader<"jump" | "left" | "right" | "fire" | "slash" | "ok" | "cancel">
    width: number
    height: number
    textBox: TextBox
}

/**
 * ゲーム本体をカプセル化したクラス。
 */
export class Game extends GameNode {
    private readonly canvas: HTMLCanvasElement
    private readonly ctx: CanvasRenderingContext2D

    private stage!: Stage
    player!: Player
    camera!: Camera

    enemies: Enemy[] = []
    bullets: Bullet[] = []

    readonly textBox

    private bulletDrawer = new BulletDrawer()
    private bulletCollision = new BulletCollision()

    constructor(
        canvas: HTMLCanvasElement,
        readonly input: DigitalInput.Reader<"right" | "left" | "jump" | "fire" | "ok" | "cancel">,
        readonly onFinish: () => void,
    ) {
        super()

        this.canvas = canvas
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("2D context is not available")
        this.ctx = ctx

        this.canvas.width = WIDTH
        this.canvas.height = HEIGHT

        this.textBox = new TextBox(this.input)
    }

    /** ステージを読み込み、初期状態をセットアップする */
    async loadFromMapData(mapData: tiled.Map): Promise<void> {
        this.stage = await loadStageFromMapData(mapData)
        this.camera = new Camera(vec(WIDTH / 2, HEIGHT / 2))
        this.reset()
    }

    get width() {
        return this.stage.width
    }

    get height() {
        return this.stage.height
    }

    private reset(): void {
        this.player = new Player(this, vec(this.stage.start.x, this.stage.start.y))
        this.camera.scale = 1

        this.gens = []
        this.enemies = []
        this.bullets = []

        this.enemies.push(new EnemyTest(this))
    }

    update(): void {
        this.ctx.clearRect(0, 0, WIDTH, HEIGHT)
        this.ctx.fillStyle = "#fcfcfc"
        this.ctx.fillRect(0, 0, WIDTH, HEIGHT)

        super.update()

        this.updateMovables()
        this.handleZoneEnter()
        this.updateBulletAndEnemy()
        this.updatePlayer()
        this.updateCamera()
        this.restartIfOutOfBounds()
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

    private updateBulletAndEnemy() {
        this.bullets.forEach((b) => b.update())
        this.enemies.forEach((e) => e.update())

        this.bullets
            .filter((b) => b.type === "enemy")
            .forEach((b) => {
                if (this.bulletCollision.isColliding(b, this.player)) {
                    this.player.life -= b.damage
                    b.life = 0
                    this.gens.push(this.drawDamage(b.p, b.damage))
                }
            })

        this.bullets
            .filter((b) => b.type === "friend")
            .forEach((b) => {
                this.enemies.forEach((e) => {
                    if (this.bulletCollision.isColliding(b, e)) {
                        e.life -= b.damage
                        b.life = 0
                        this.gens.push(this.drawDamage(b.p, b.damage))
                    }
                })
            })

        const aliveBullets = this.bullets.filter((b) => b.life > 0)
        this.bullets.length = 0
        this.bullets.push(...aliveBullets)

        const aliveEnemies = this.enemies.filter((e) => e.life > 0)
        this.enemies.length = 0
        this.enemies.push(...aliveEnemies)
    }

    private updatePlayer(): void {
        const stage = this.stage

        this.player.move(this.input)
        this.player.update()
        this.player.resolveCollisions(stage.movables.filter((obj) => obj instanceof Edge))
    }

    private updateCamera(): void {
        this.camera.update(vec(WIDTH / 2, HEIGHT / 2), this.player.g)
    }

    private restartIfOutOfBounds(): void {
        const stage = this.stage

        // ステージ外に落ちたらリスタート
        if (
            this.player.p.x < -10 ||
            this.player.p.x > stage.width + 10 ||
            this.player.p.y < -10 ||
            this.player.p.y > stage.height + 10
        ) {
            this.reset()
        }
    }

    private draw(): void {
        const stage = this.stage
        const ctx = this.ctx

        ctx.save()
        this.camera.apply(ctx, WIDTH, HEIGHT)

        for (const t of stage.movables) t.draw(ctx)
        this.player.draw(ctx)

        this.enemies.forEach((e) => e.draw(ctx))
        this.bullets.forEach((b) => this.bulletDrawer.draw(b, ctx))

        ctx.restore()
    }

    private *drawDamage(p: Vec, damage: number) {
        const frame = 30

        for (let i = 0; i < frame; i++) {
            Ctx.text(this.ctx, p.l, `rgba(255,0,0,${1 - i / frame})`, `${damage}`, {
                fontSize: 32,
                fontFamily: "serif",
            })
            yield
        }
    }
}
