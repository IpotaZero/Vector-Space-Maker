import { vec } from "@ipota/vec"
import { Enemy } from "../Game/Actor/Enemy"
import { GameLike } from "../Game/Game"
import { Remodel, remodel } from "../Game/Remodel"

export class EnemyTest extends Enemy {
    constructor(game: GameLike) {
        super(game)
        this.p = this.game.player.p.add(vec(0, -50))
        this.r = 48
        this.life = 1000

        this.addScript(this.text.bind(this))
    }

    private *text() {
        yield* this.game.textBox.say([
            "おい！そこのお前！",
            "きひひっ、この先は獄卒が見張ってるぜぇ。",
            "俺様の忠告を無視するのかっ！？<br>生意気なヤツめっ。<br>やっつけてやる！",
        ])

        this.addScript(this.attack.bind(this), { loop: Infinity })
        this.addScript(this.move.bind(this), { loop: Infinity })
    }

    private *attack() {
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

    private *move() {
        yield* this.moveTo(vec((this.game.width / 4) * 3, this.game.height / 4), 60)
        yield* Array(60)
        yield* this.moveTo(vec(this.game.width / 4, this.game.height / 4), 60)
        yield* Array(60)
    }
}
