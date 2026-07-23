import { vec } from "@ipota/vec"
import { Enemy } from "../Game/Actor/Enemy"
import { GameLike } from "../Game/Game"
import { Remodel, remodel } from "../Game/Remodel"
import { T } from "../T"

export class EnemyTest extends Enemy {
    constructor(game: GameLike) {
        super(game, 100)
        this.p = vec(400, 400)
        this.r = 48

        this.addScript(this.text.bind(this))
    }

    private *phase() {
        this.addScript(this.attack0.bind(this), { loop: Infinity, id: "attack0" })
        this.addScript(this.move0.bind(this), { loop: Infinity, id: "move0" })

        while (this.life > 50) yield

        this.removeScript("attack0")
        this.removeScript("move0")

        this.game.gltfViewer.show("assets/3d/bos.gltf", {
            scale: 0.8,
            p: [1.5, -1.5, -5],
            rotateY: -T / 12,
            animationName: "fluttering",
        })
        yield* this.moveTo(vec(this.game.width - 200, 200), 120)
        yield* this.game.textBox.say(["いちちっ！近寄るんじゃあないっ！"], { name: "ボス" })
        this.game.gltfViewer.hide()

        this.addScript(this.attack1.bind(this), { loop: Infinity, id: "attack1" })
        this.addScript(this.move1.bind(this), { loop: Infinity, id: "move1" })
    }

    *onDead(): Generator {
        this.game.gltfViewer.show("assets/3d/bos.gltf", {
            scale: 0.8,
            p: [1.5, -1.5, -5],
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
            p: [1.5, -1.5, -5],
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
        yield
    }

    private *move1() {
        yield
    }
}
