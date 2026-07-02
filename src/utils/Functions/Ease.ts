export namespace Ease {
    const easeSym = Symbol("ease")

    export type Type = ((x: number) => number) & { [easeSym]: true }

    const createEasingFunction = (f: (x: number) => number) => Object.assign(f, { [easeSym]: true }) as Type

    export const Linear = createEasingFunction((x) => x)
    export const In = createEasingFunction((x) => x ** 2)
    export const Out = createEasingFunction((x) => 1 - (1 - x) ** 2)
    export const InOut = createEasingFunction((x) => 3 * x ** 2 - 2 * x ** 3)
    export const Sin = createEasingFunction((x) => Math.sin(x * Math.PI))
    export const InSin = createEasingFunction((x) => 1 - Math.cos((x * Math.PI) / 2))

    export const join = (A: Type, B: Type) => createEasingFunction((x) => A(B(x)))
}
