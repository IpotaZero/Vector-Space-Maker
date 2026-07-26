import { Ctx } from "../../utils/Functions/Ctx"
import { DigitalInput } from "@ipota/input"
import { vec, Vec } from "@ipota/vec"
import { Actor } from "./Actor"
import { T } from "../../T"
import { remodel } from "../Remodel"
import { GameLike } from "../Game"
import { GltfViewer } from "../../utils/GltfViewer"
import { Physics } from "../Physics"
import { se } from "../../se"

const SPEED = 3
const JUMP = 48 * 0.3

export class Player extends Actor {
    private physics: Physics = new Physics(this.game, this, () => {
        if (this.onFloor.filter((x) => x).length <= 1) {
            se.land.play()
        }

        this.onFloor.push(true)
        this.canDoubleJump = true // 着地時に2段ジャンプを回復
    })

    invincibleFrame = 0

    g: Vec = vec(0, 0.7)
    v: Vec = vec(0, 0)

    private onFloor: boolean[] = []
    private isJumping = false
    private canDoubleJump = true // 2段ジャンプの権利

    private rotation = 0
    private gltfViewer = new GltfViewer(300, 300)

    private playable = true

    private readonly maxLife = 10

    /**最後に入力した方向 */
    private direction = 1

    constructor(game: GameLike, start: Vec) {
        super(game)
        this.p = start
        this.life = 10

        this.addScript(this.attack.bind(this), { loop: Infinity })
        this.addScript(this.physicsUpdate.bind(this), { loop: Infinity, id: "physics" })

        this.gltfViewer.show("assets/3d/hare.glb", {
            scale: 1.2,
            p: [0, 0, -5],
            rotateY: T / 8,
            animationName: "wait",
        })
    }

    update() {
        super.update()

        if (this.invincibleFrame > 0) {
            this.invincibleFrame--
        }
    }

    knockBack(impulse: Vec, time: number) {
        this.v = this.v.add(impulse)
        this.sleep(1)
        this.addScript(() => this.knockBackG(time))
    }

    private *knockBackG(time: number): Generator {
        this.playable = false
        yield* Array(time)
        this.playable = true
    }

    dispose() {
        this.gltfViewer.dispose()
    }

    /**
     * 物理演算(重力の積分・摩擦・衝突解決)を毎フレーム行うスクリプト。
     * addScriptで登録され、loop: Infinityにより毎フレーム再実行される。
     */
    private *physicsUpdate() {
        this.onFloor = this.onFloor.slice(-6)
        this.onFloor.push(false)

        this.rotation += this.v.dot(this.g.normal()) / 36

        this.physics.update()

        yield
    }

    move(input: DigitalInput.Reader<"left" | "right" | "jump">): void {
        if (!this.playable) return

        if (input.isPressed("right")) {
            this.v = this.v.add(this.g.normal().scale(SPEED))
            this.direction = 1
            this.gltfViewer.setRotationY(-T / 8 - T / 4)
            this.gltfViewer.playIdle("run", true)
        } else if (input.isPressed("left")) {
            this.v = this.v.add(this.g.normal().scale(-SPEED))
            this.direction = -1
            this.gltfViewer.setRotationY(T / 8 + T / 4)
            this.gltfViewer.playIdle("run", true)
        } else {
            this.gltfViewer.playIdle("wait", true)
        }

        if (input.isPressed("jump")) {
            if (this.onFloor.includes(true)) {
                this.jump()
                this.onFloor = []
                se.jump.play()

                this.gltfViewer.playOnce("jump")
            } else if (this.canDoubleJump && !this.isJumping) {
                this.jump()
                this.canDoubleJump = false
                se.doubleJump.play()

                this.gltfViewer.playOnce("double-jump")
            }
        } else {
            // ジャンプキャンセル（小ジャンプ）の計算を簡略化
            if (this.isJumping && this.v.dot(this.g) < 0) {
                const vUp = this.g.normalize().scale(this.v.dot(this.g.normalize()))
                this.v = this.v.sub(vUp.scale(0.5))
            }
            this.isJumping = false
        }
    }

    private jump(): void {
        const gDir = this.g.normalize()
        // 現在の垂直速度を消去してからジャンプ力を加える（落下中の2段ジャンプ対策）
        this.v = this.v.sub(gDir.scale(this.v.dot(gDir))).add(gDir.scale(-JUMP))
        this.isJumping = true
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const center = this.p.add(this.g.normalize().scale(-40))
        Ctx.polygon(ctx, 8, 2, center.l, 48, "#1114", { theta: this.rotation / 32, lineWidth: 0.5 })
        Ctx.arc(ctx, center.l, 16, "#1114", { lineWidth: 0.5 })
        Ctx.text(ctx, center.l, "#111", "罪", {
            align: "center",
            baseline: "middle",
            fontSize: 0.5,
            fontFamily: "serif",
        })

        if (this.game.isBossBattle) {
            const w = this.game.width / 4

            Ctx.rect(ctx, [64, 64], [w, 32], "#80808080", { lineWidth: 1 })
            Ctx.rect(
                ctx,
                [64 + w * (this.life / this.maxLife), 64],
                [w * (1 - this.life / this.maxLife), 32],
                "#80808080",
                {
                    lineWidth: 0,
                },
            )
        }

        this.gltfViewer.update()

        ctx.save()
        if (this.invincibleFrame > 0 && Math.floor(this.invincibleFrame / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5
        }
        ctx.translate(this.p.x, this.p.y)
        ctx.rotate(this.g.radian() - T / 4)
        ctx.drawImage(this.gltfViewer.canvas, -150, -150 - 20)
        ctx.restore()
    }

    hitSlash() {
        if (!this.onFloor.includes(true)) {
            this.v = this.v.add(this.g.scale(-10))
        }
    }

    private *attack() {
        // 遠距離
        if (this.game.input.isPushed("fire")) {
            this.gltfViewer.playOnce("shot")

            yield* remodel(this)
                .p(this.p.add(this.g.normalize().scale(-40)))
                .type("friend")
                .radian(this.g.radian() + (-T / 4) * this.direction)
                .speed(28)
                .fire(this.game.bullets)
        }

        // 近距離(15frame)
        if (this.game.input.isPushed("slash")) {
            this.gltfViewer.playOnce("slash")

            yield* remodel(this)
                .alpha(0)
                .damage(5)
                .type("friend")
                .speed(0)
                .r(this.r * 12)
                .g(function* (me) {
                    me.alpha = 1
                    for (let i = 0; i < 15; i++) {
                        me.p = this.p.add(this.g.normal().scale(this.direction * 32)).add(this.g.normalize().scale(-40))
                        yield
                    }
                    me.life = 0
                })
                .fire(this.game.bullets)
        }
        yield
    }
}
