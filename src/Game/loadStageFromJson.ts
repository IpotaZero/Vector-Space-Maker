import * as tiled from "@kayahr/tiled"
import { Stage } from "./Stage.js"
import { edge, Edge } from "./Edge.js"
import { GravityZone } from "./zone/GravityZone.js"
import { vec } from "../utils/Vec"
import { Text } from "./Text.js"
import { ScaleZone } from "./zone/ScaleZone.js"
import { Zone } from "./zone/Zone.js"

export async function loadStageFromJson(url: string): Promise<Stage> {
    const response = await fetch(url)
    // JSON全体を tiled.Map 型としてキャスト
    const mapData = (await response.json()) as tiled.Map

    const texts: Text[] = []
    const edges: Edge[] = []
    const zones: Zone[] = []
    let start = { x: 0, y: 0 }
    let goal = { x: 0, y: 0, r: 16 }

    for (const layer of mapData.layers) {
        // 型ガードを使って ObjectGroup（オブジェクトレイヤー）のみに絞り込む
        if (!tiled.isObjectGroup(layer)) continue

        // このブロック内では layer.objects に安全にアクセスできる
        for (const obj of layer.objects) {
            // ポリラインを持つオブジェクト
            if (obj.polyline) {
                for (let i = 0; i < obj.polyline.length - 1; i++) {
                    const p1 = obj.polyline[i]
                    const p2 = obj.polyline[i + 1]
                    edges.push(edge(obj.x + p1.x, obj.y + p1.y, obj.x + p2.x, obj.y + p2.y))
                }
            }

            if (obj.text) {
                texts.push(
                    new Text(
                        obj.x,
                        obj.y,
                        obj.width!,
                        obj.height!,
                        (obj.rotation! / 180) * Math.PI,
                        obj.text.text,
                        obj.text.pixelsize,
                    ),
                )
            }

            // カスタムプロパティを持つオブジェクト
            if (obj.name === "GravityZone") {
                // properties から値を取り出す際も型推論が効く
                const gx = (obj.properties?.find((p) => p.name === "gx")?.value as number) || 0
                const gy = (obj.properties?.find((p) => p.name === "gy")?.value as number) || 1
                zones.push(
                    new GravityZone(
                        obj.x + obj.width! / 2,
                        obj.y + obj.height! / 2,
                        obj.width!,
                        obj.height!,
                        vec(gx, gy),
                    ),
                )
            }

            if (obj.name === "Scale") {
                const gx = (obj.properties?.find((p) => p.name === "scale")?.value as number) || 1
                zones.push(new ScaleZone(obj.x + obj.width! / 2, obj.y + obj.height! / 2, obj.width!, obj.height!, gx))
            }

            if (obj.name === "Start") {
                start = { x: obj.x, y: obj.y }
            }

            if (obj.name === "Goal") {
                goal = { x: obj.x + obj.width! / 2, y: obj.y + obj.height! / 2, r: obj.width! / 2 }
            }
        }
    }

    return new Stage(
        mapData.width * mapData.tilewidth,
        mapData.height * mapData.tileheight,
        texts,
        edges,
        zones,
        start,
        goal,
    )
}
