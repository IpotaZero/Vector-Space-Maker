import { vec } from "@ipota/vec"
import { Enemy } from "../Game/Actor/Enemy"
import { GameLike } from "../Game/Game"
import { Remodel, remodel } from "../Game/Remodel"
import { T } from "../T"
import { bm } from "../bm"

export default class extends Enemy {
    constructor(game: GameLike) {
        super(game, 100, 96)
        this.p = vec(800, 600)

        this.addScript(this.text.bind(this))

        this.gltfViewer.show("assets/3d/C8.glb", {
            scale: 1,
            p: [0, 0, -5],
            rotateY: -T / 24,
            animationName: "fluttering",
        })
    }

    hit(): void {
        super.hit()
        this.gltfViewer.playOnce("damage")
    }

    private *phase() {
        this.addScript(this.attack0.bind(this), { loop: Infinity, id: "attack0" })
        this.addScript(this.move0.bind(this), { loop: Infinity, id: "move0" })

        while (this.life > 50) yield

        this.removeScript("attack0")
        this.removeScript("move0")

        yield* this.moveTo(vec(this.game.width - 200, 200), 120)
        yield* this.game.textBox.say(
            ["いちちっ！近寄るんじゃあないっ！", "決してXを押して遠距離攻撃なんかするなよな！"],
            { name: "C8" },
        )
        this.game.gltfViewer.hide()

        this.addScript(this.attack1.bind(this), { loop: Infinity, id: "attack1" })
        this.addScript(this.move1.bind(this), { loop: Infinity, id: "move1" })
    }

    *onDead(): Generator {
        yield* super.onDead()

        bm.fadeOut(2)

        yield* Array(120)

        yield* this.game.textBox.say(
            [
                "やーらーれーたーっ",
                "あんた、名前は？",
                "へえ、『ハレ』か。良い名前じゃん！",
                "俺の名前は『C8』！",
                "獄卒が居るのはホントなんだけど……<br>ふぇっ、閻魔様に会いに行く？",
                "ええっお前自分が何で地獄に落ちたのか覚えてないのかっ！？",
                "へっへっへ、なんかおもろそー、俺もついていくかぁ！",
            ],
            { name: "C8" },
        )

        this.game.onFinish()
    }

    private *text() {
        yield* this.game.textBox.say(["おい！そこのお前！"], { name: "C8" })

        yield* this.game.textBox.say(["..."], {
            name: "???",
        })

        yield* this.game.textBox.say(
            [
                "へっへっへ、この先は獄卒が見張ってるぜぇ。",
                "俺の忠告を無視するのかっ！？<br>生意気なヤツめっ。<br>やっつけてやる！",
                "そこを動くんじゃあないぞ。決して矢印キーを押したりZを押したりするんじゃあないぞ！",
            ],
            {
                name: "C8",
            },
        )

        bm.load({
            src: "assets/bgm/test.mp3",
        }).then(() => {
            bm.play()
        })

        this.addScript(this.phase.bind(this))
    }

    private *attack0() {
        this.gltfViewer.playOnce("charge", { canOverride: false })
        yield* Array(120)

        yield* remodel(this)
            .p(this.p.clone())
            .radian(T / 2)
            .beam(this.game.width)
            .r(64)
            .g(function* (me) {
                yield* Array(60)
                yield* Remodel.fadeout(me, 30)
            })
            .fire(this.game.bullets)

        yield* Array(300)
    }

    private *move0() {
        yield* this.moveTo(vec((this.game.width / 4) * 4, (this.game.height / 4) * 3.5), 60)
        yield* Array(120)
    }

    private *attack1() {
        this.gltfViewer.playOnce("charge", { canOverride: false })
        yield* Array(120)

        for (let i = 0; i < 4; i++)
            yield* remodel(this)
                .collision("arrow")
                .appearance("arrow")
                .r(38)
                .p(this.p.clone())
                .aim(this.game.player.p)
                .duplicate(63, (me, i) => {
                    me.radian = i % 2 === 0 ? (i / 63) * T : (-i / 63) * T
                    return me
                })
                .delayByIndex()
                .g(function* (me) {
                    yield* Remodel.stop(me, 30)
                    yield* Array(63 - i)
                    yield* Remodel.accel(me, 30, 31)
                })
                .fire(this.game.bullets)

        yield* Array(180)

        for (let i = 0; i < 4; i++) {
            this.gltfViewer.playOnce("charge-short", { canOverride: false })

            yield* remodel(this)
                .damage(3)
                .p(this.p.clone())
                .laser(30, 20, this.game.width)
                .aim(this.game.player.p)
                .nway(23, T / 24)
                .fire(this.game.bullets)

            yield* Array(45)
        }

        yield* Array(180)
    }

    private *move1() {
        yield
    }
}
