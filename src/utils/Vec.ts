// 2次元ベクトル
export class Vec2 {
    constructor(
        public x: number,
        public y: number,
    ) {}

    get l(): [number, number] {
        return [this.x, this.y]
    }

    add(v: Vec2): Vec2 {
        return new Vec2(this.x + v.x, this.y + v.y)
    }

    sub(v: Vec2): Vec2 {
        return new Vec2(this.x - v.x, this.y - v.y)
    }

    mul(s: number): Vec2 {
        return new Vec2(this.x * s, this.y * s)
    }

    magnitude(): number {
        return Math.hypot(this.x, this.y)
    }

    normalized(): Vec2 {
        const l = this.magnitude()
        return l === 0 ? this : new Vec2(this.x / l, this.y / l)
    }

    // 反時計回り(数学的な正方向)に rad 回転させる
    rotate(rad: number): Vec2 {
        const c = Math.cos(rad)
        const s = Math.sin(rad)
        return new Vec2(this.x * c - this.y * s, this.x * s + this.y * c)
    }

    dot(v: Vec2): number {
        return this.x * v.x + this.y * v.y
    }

    // 外積 (this × v)
    cross(v: Vec2): number {
        return this.x * v.y - this.y * v.x
    }

    angle(): number {
        return Math.atan2(this.y, this.x)
    }

    // 元コード(vec.js)と同じ定義: 進行方向を反時計回りに90度回した法線
    normal(): Vec2 {
        const n = this.normalized()
        return new Vec2(n.y, -n.x)
    }
}

export const vec = (x: number, y: number): Vec2 => new Vec2(x, y)
export const vecFromAngle = (theta: number): Vec2 => new Vec2(Math.cos(theta), Math.sin(theta))
