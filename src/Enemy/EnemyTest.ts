import { vec } from "@ipota/vec"
import { GameLike } from "../Game/Actor/Actor"
import { Enemy } from "../Game/Actor/Enemy"
import { Remodel, remodel } from "../Game/Remodel"

export class EnemyTest extends Enemy {
    constructor(game: GameLike) {
        super(game)
        this.p = this.game.player.p.add(vec(0, -50))
        this.r = 48
        this.life = 1000
        this.addScript(this.G.bind(this), { loop: Infinity })
        this.addScript(this.H.bind(this), { loop: Infinity })
    }

    private *G() {
        yield* remodel(this)
            .p(this.p.clone())
            .aim(this.game.player.p)
            .appearance("arrow")
            .collision("arrow")
            .r(28)
            .ex(13)
            .delayByIndex()
            .g(function* (me, index) {
                yield* Remodel.reaccel(me, 30, 31 - index, 30)
            })
            .fire(this.game.bullets)

        yield* Array(30)
    }

    private *H() {
        yield* this.moveTo(vec((this.game.width / 4) * 3, this.game.height / 4), 60)
        yield* Array(60)
        yield* this.moveTo(vec(this.game.width / 4, this.game.height / 4), 60)
        yield* Array(60)
    }
}
