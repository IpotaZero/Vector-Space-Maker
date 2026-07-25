import { Enemy } from "../Game/Actor/Enemy"
import { GameLike } from "../Game/Game"

// このフォルダ内のEnemyサブクラスを、Tiledで指定された名前文字列から
// 解決できるように、あらかじめ全モジュールを読み込んでおく
// @ts-ignore
const modules = import.meta.glob<Record<string, unknown>>("./*.ts", { eager: true })

console.log("[createEnemy] modules:", modules)

/**
 * Tiledの "enemy" プロパティ（クラス名の文字列）から、対応する
 * Enemyサブクラスをインスタンス化する。
 *
 * Stage側（Tiled読み込み時）はまだGameインスタンスが存在しないため、
 * ここでは実体化せず、位置と種類だけをデータとして持ち回る。
 * 実際の生成はGameが構築された後（Game.reset()内）に、この関数を通して行う。
 */
export function createEnemy(type: string, game: GameLike): Enemy | undefined {
    const mod = modules[`./${type}.ts`]

    if (!mod) {
        console.warn(`[createEnemy] Enemy type "${type}" が見つかりません`)
        return undefined
    }

    const EnemyClass = mod.default as (new (game: GameLike) => Enemy) | undefined

    if (!EnemyClass) {
        console.warn(`[createEnemy] "${type}" というexportがモジュール内に見つかりません`)
        return undefined
    }

    return new EnemyClass(game)
}
