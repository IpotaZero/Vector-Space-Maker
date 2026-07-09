export class RegExpDict<T, S extends string = string> {
    private readonly dict: Record<S, T>

    private readonly regExpCache: Record<string, RegExp>

    constructor(dict: Record<S, T>) {
        this.dict = dict
        this.regExpCache = {}
    }

    get(key: string): T | undefined {
        for (const [reg, value] of Object.entries(this.dict)) {
            if (this.getRegExp(reg as S).test(key)) {
                return value as T
            }
        }
    }

    *getAll(key: string): Generator<T> {
        for (const [reg, value] of Object.entries(this.dict)) {
            if (this.getRegExp(reg as S).test(key)) {
                yield value as T
            }
        }
    }

    getKeys(): S[] {
        return Object.keys(this.dict) as S[]
    }

    getValues(): T[] {
        return Object.values(this.dict)
    }

    add(reg: S, value: T) {
        this.dict[reg] = value
    }

    private getRegExp(reg: S): RegExp {
        this.addToCache(reg)
        return this.regExpCache[reg]
    }

    private addToCache(reg: S) {
        if (!this.regExpCache[reg]) {
            this.regExpCache[reg] = new RegExp(`^${reg}$`)
        }
    }
}
