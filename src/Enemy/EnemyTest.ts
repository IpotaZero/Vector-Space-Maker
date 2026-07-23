import { vec } from "@ipota/vec"
import { Enemy } from "../Game/Actor/Enemy"
import { GameLike } from "../Game/Game"
import { Remodel, remodel } from "../Game/Remodel"
import { T } from "../T"
import { GenUtils } from "@ipota/functions"

export class EnemyTest extends Enemy {
    constructor(game: GameLike) {
        super(game, 100, 48)
        this.p = vec(800, 400)

        this.addScript(this.text.bind(this))

        this.gltfViewer.show("assets/3d/bos.gltf", {
            scale: 1,
            p: [0, 0, -5],
            rotateY: -T / 24,
            animationName: "fluttering",
        })
    }

    private *phase() {
        this.addScript(this.attack0.bind(this), { loop: Infinity, id: "attack0" })
        this.addScript(this.move0.bind(this), { loop: Infinity, id: "move0" })

        while (this.life > 50) yield

        this.removeScript("attack0")
        this.removeScript("move0")

        this.game.gltfViewer.show("assets/3d/bos.gltf", {
            scale: 0.8,
            p: [1.5, -1, -5],
            rotateY: -T / 12,
            animationName: "fluttering",
        })
        yield* this.moveTo(vec(this.game.width - 200, 200), 120)
        yield* this.game.textBox.say(
            ["いちちっ！近寄るんじゃあないっ！", "決してXを押して遠距離攻撃なんかするなよな！"],
            { name: "ボス" },
        )
        this.game.gltfViewer.hide()

        this.addScript(this.attack1.bind(this), { loop: Infinity, id: "attack1" })
        this.addScript(this.move1.bind(this), { loop: Infinity, id: "move1" })
    }

    *onDead(): Generator {
        yield* super.onDead()

        this.game.gltfViewer.show("assets/3d/bos.gltf", {
            scale: 0.8,
            p: [1.5, -1, -5],
            rotateY: -T / 12,
            animationName: "fluttering",
        })
        yield* Array(120)

        yield* this.game.textBox.say(
            [
                "やーらーれーたーっ",
                "……あんた、名前は？",
                "へえ、『ハレ』か。良い名前じゃん！",
                "俺様は畜生の『ボス』！",
                "獄卒が居るのはホントなんだけど……<br>ふぇっ、閻魔様に会いに行く？",
                "なんかおもろそー、俺様もついていくかぁ！",
            ],
            { name: "ボス" },
        )
    }

    private *text() {
        this.game.gltfViewer.show("assets/3d/bos.gltf", {
            scale: 0.8,
            p: [1.5, -1, -5],
            rotateY: -T / 12,
            animationName: "fluttering",
        })

        yield* this.game.textBox.say(
            [
                "おい！そこのお前！",
                "へっへっへ、この先は獄卒が見張ってるぜぇ。",
                "俺様の忠告を無視するのかっ！？<br>生意気なヤツめっ。<br>やっつけてやる！",
                "そこを動くんじゃあないぞ。決して矢印キーを押したりZを押したりするんじゃあないぞ！",
            ],
            { name: "ボス" },
        )

        this.game.gltfViewer.hide()

        this.addScript(this.phase.bind(this))
    }

    private *attack0() {
        // yield* remodel(this)
        //     .p(this.p.clone())
        //     .aim(this.game.player.p)
        //     .appearance("arrow")
        //     .collision("arrow")
        //     .r(28)
        //     .ex(13)
        //     .delayByIndex()
        //     .g(function* (me, index) {
        //         yield* Remodel.stop(me, 30)
        //         yield* Array(31 - index)
        //         yield* Remodel.ease(me, "radian", this.game.player.p.sub(me.p).radian(), 30)
        //         yield* Remodel.accel(me, 30, 48)
        //     })
        //     .fire(this.game.bullets)

        // yield* remodel(this).p(this.p.clone()).beam(this.game.width).fire(this.game.bullets)

        yield* Array(300)
    }

    private *move0() {
        yield* this.moveTo(vec((this.game.width / 4) * 3, this.game.height / 4), 60)
        yield* Array(60)
        yield* this.moveTo(vec(this.game.width / 4, this.game.height / 4), 60)
        yield* Array(60)
    }

    private *attack1() {
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
            yield* remodel(this)
                .damage(3)
                .p(this.p.clone())
                .laser(30, 20, this.game.width)
                .aim(this.game.player.p)
                .nway(23, T / 24)
                .fire(this.game.bullets)

            yield* Array(60)
        }

        yield* Array(300)
    }

    private *move1() {
        yield
    }
}
