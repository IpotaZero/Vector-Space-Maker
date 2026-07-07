import * as tiled from "@kayahr/tiled"
import { Stage } from "./Stage.js"
import { vec, Vec2 } from "../utils/Vec"
import { Edge } from "./movable/Edge.js"
import { GoalZone } from "./movable/zone/GoalZone.js"
import { GravityZone } from "./movable/zone/GravityZone.js"
import { ScaleZone } from "./movable/zone/ScaleZone.js"
import { TextObject } from "./movable/TextObject.js"
import { Movable } from "./movable/Movable.js"

export async function loadStageFromUrl(url: string): Promise<Stage> {
    const response = await fetch(url)
    // JSON全体を tiled.Map 型としてキャスト
    const mapData = (await response.json()) as tiled.Map

    return loadStageFromMapData(mapData)
}

export async function loadStageFromMapData(mapData: tiled.Map): Promise<Stage> {
    const movables: Movable[] = []
    let start = { x: 0, y: 0 }

    // "joints" (object型のlistプロパティ) が参照するオブジェクトの位置を
    // 引けるように、先にすべてのオブジェクトのIDと位置を集めておく
    const objectPositions = new Map<number, { x: number; y: number }>()
    for (const layer of mapData.layers) {
        if (!tiled.isObjectGroup(layer)) continue
        for (const obj of layer.objects) {
            objectPositions.set(obj.id, { x: obj.x, y: obj.y })
        }
    }

    for (const layer of mapData.layers) {
        // 型ガードを使って ObjectGroup（オブジェクトレイヤー）のみに絞り込む
        if (!tiled.isObjectGroup(layer)) continue

        // このブロック内では layer.objects に安全にアクセスできる
        for (const obj of layer.objects) {
            const cycle = obj.properties?.find((p) => p.name === "cycle")?.value as number | undefined

            // "joints" は Tiled 1.12 で追加された object 型のリストプロパティ。
            // @kayahr/tiled の型定義がまだ list 型に対応していないため、
            // ここだけ型を無しにして緩く扱う。
            const moveJoints = obj.properties?.find((p) => p.name === "joints") as any
            let joints: Vec2[] = []

            if (moveJoints?.type === "list") {
                // list の各要素は、object 型プロパティ相当の値(参照先オブジェクトのid)、
                // または { value: id } の形で入ってくることがあるため、両方に対応する
                joints = (moveJoints.value as any[])
                    .map((item) => {
                        const objectId: number = typeof item === "object" && item !== null ? item.value : item
                        return objectPositions.get(objectId)
                    })
                    .filter((position): position is { x: number; y: number } => position !== undefined)
                    .map((position) => vec(position.x, position.y))
            }

            joints.unshift(vec(obj.x, obj.y)) // 最後にオブジェクト自身の位置を追加
            joints.push(vec(obj.x, obj.y)) // 最後にオブジェクト自身の位置を追加

            // ポリラインを持つオブジェクト
            if (obj.polyline) {
                for (let i = 0; i < obj.polyline.length - 1; i++) {
                    const p1 = obj.polyline[i]
                    const p2 = obj.polyline[i + 1]
                    // joints は obj原点(obj.x, obj.y)の軌跡なので、
                    // このセグメントの始点(obj原点からp1だけずれた位置)が
                    // 同じように動くよう、joints も p1 分だけ平行移動させる。
                    // これをしないと全セグメントが同じ絶対座標に向かって動いてしまい、
                    // ポリラインの形が崩れて連続しなくなる。
                    const segmentJoints = joints.map((j) => j.add(vec(p1.x, p1.y)))
                    movables.push(
                        new Edge(obj.x + p1.x, obj.y + p1.y, obj.x + p2.x, obj.y + p2.y, {
                            joints: segmentJoints,
                            cycle,
                        }),
                    )
                }
            }

            if (obj.polygon) {
                for (let i = 0; i < obj.polygon.length; i++) {
                    const p1 = obj.polygon[i]
                    const p2 = obj.polygon[(i + 1) % obj.polygon.length]
                    // polylineと同様、セグメントの始点オフセット(p1)分だけ joints をずらす
                    const segmentJoints = joints.map((j) => j.add(vec(p1.x, p1.y)))
                    movables.push(
                        new Edge(obj.x + p1.x, obj.y + p1.y, obj.x + p2.x, obj.y + p2.y, {
                            joints: segmentJoints,
                            cycle,
                        }),
                    )
                }
            }

            if (obj.text) {
                movables.push(
                    new TextObject(
                        vec(obj.x, obj.y),
                        obj.width!,
                        obj.height!,
                        (obj.rotation! / 180) * Math.PI,
                        obj.text.text,
                        obj.text.pixelsize,
                        {
                            joints,
                            cycle,
                        },
                    ),
                )
            }

            // カスタムプロパティを持つオブジェクト
            if (obj.name === "Gravity") {
                // properties から値を取り出す際も型推論が効く
                const gx = (obj.properties?.find((p) => p.name === "gx")?.value as number) ?? 0
                const gy = (obj.properties?.find((p) => p.name === "gy")?.value as number) ?? 0
                movables.push(
                    new GravityZone(
                        vec(obj.x + obj.width! / 2, obj.y + obj.height! / 2),
                        obj.width!,
                        obj.height!,
                        vec(gx, gy),
                        {
                            joints,
                            cycle,
                        },
                    ),
                )
            }

            if (obj.name === "Scale") {
                const gx = (obj.properties?.find((p) => p.name === "scale")?.value as number) || 1
                movables.push(
                    new ScaleZone(
                        vec(obj.x, obj.y), // ← 中心座標に変換
                        obj.width!,
                        obj.height!,
                        gx,
                        {
                            joints,
                            cycle,
                        },
                    ),
                )
            }

            if (obj.name === "Start") {
                start = { x: obj.x, y: obj.y }
            }

            if (obj.name === "Goal") {
                movables.push(
                    new GoalZone(
                        vec(obj.x, obj.y), // ← 中心座標に変換
                        obj.width!,
                        obj.height!,
                        {
                            joints,
                            cycle,
                        },
                    ),
                )
            }
        }
    }

    return new Stage(mapData.width * mapData.tilewidth, mapData.height * mapData.tileheight, movables, start)
}
