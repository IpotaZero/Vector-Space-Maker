export class RegExpDict<T, S extends string = string> {
    readonly #dict: Record<S, T>

    constructor(dict: Record<S, T> = {} as Record<S, T>) {
        this.#dict = dict
    }

    get(key: string): T | undefined {
        for (const [reg, value] of Object.entries(this.#dict)) {
            if (new RegExp(`^${reg}$`).test(key)) {
                return value as T
            }
        }
    }

    *getAll(key: string): Generator<T> {
        for (const [reg, value] of Object.entries(this.#dict)) {
            if (new RegExp(`^${reg}$`).test(key)) {
                yield value as T
            }
        }
    }

    getKeys(): S[] {
        return Object.keys(this.#dict) as S[]
    }

    getValues(): T[] {
        return Object.values(this.#dict)
    }

    add(reg: S, value: T) {
        this.#dict[reg] = value
    }
}
