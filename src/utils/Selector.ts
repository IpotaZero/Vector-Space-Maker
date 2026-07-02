export type SelectorOptions<Alias extends string> = {
    alias: Alias
    expectedCount?: number
    attr?: Record<string, string>
}

export class Selector<Alias extends string> {
    private readonly elements = new Map<Alias, HTMLElement[]>()

    constructor(
        private readonly configs: Record<string, SelectorOptions<Alias>>,
    ) {}

    /**
     * 指定したコンテナから要素を抽出し、バリデーションを実行してメモリに格納します。
     */
    load(container: HTMLElement): void {
        for (const [selector, options] of Object.entries(this.configs)) {
            const { alias, attr, expectedCount = 1 } = options

            const foundElements = Array.from(
                container.querySelectorAll(selector),
            ).filter((e) => e instanceof HTMLElement)

            this.validateCount(selector, foundElements, expectedCount)

            if (attr) {
                foundElements.forEach((el) => this.checkAttributes(el, attr))
            }

            this.elements.set(alias, foundElements)
        }
    }

    // --- 操作メソッド ---

    onClick(
        alias: Alias,
        handler: (args: {
            element: HTMLElement
            event: Event
            index: number
        }) => void,
    ): void {
        this.forEachElement(alias, (el, i) => {
            el.addEventListener("click", (e) =>
                handler({ element: el, event: e, index: i }),
            )
        })
    }

    appendTo(alias: Alias, child: HTMLElement): void {
        this.forEachElement(alias, (el) => el.appendChild(child))
    }

    writeTo(alias: Alias, text: string): void {
        this.forEachElement(alias, (el) => {
            el.textContent = text
        })
    }

    enable(alias: Alias, available: boolean): void {
        this.forEachElement(alias, (el) => {
            if ("disabled" in el) {
                Object.assign(el, { disabled: !available })
            } else {
                console.error(el)
                throw new Error(
                    "disabledを持っていないものに対して設定しようとした。",
                )
            }
        })
    }

    toggleClassTo(alias: Alias, className: string, force?: boolean): void {
        this.forEachElement(alias, (el) => {
            el.classList.toggle(className, force)
        })
    }

    getFirst<Type extends typeof HTMLElement>(
        alias: Alias,
        Type?: Type,
    ): InstanceType<Type> {
        const els = this.elements.get(alias)

        if (!els) {
            throw new Error(
                `Alias "${alias}" はまだロードされていないか、存在しません。先に load() を呼び出してください。`,
            )
        }

        if (Type && !(els[0] instanceof Type)) new Error("")

        return els[0] as InstanceType<Type>
    }

    getAll<Type extends typeof HTMLElement>(
        alias: Alias,
        Type?: Type,
    ): readonly InstanceType<Type>[] {
        if (
            Type &&
            !this.elements.get(alias)!.every((el) => el instanceof Type)
        )
            new Error("")

        return this.elements.get(alias) as InstanceType<Type>[]
    }

    /**
     * 親要素に対して、子要素のイベントを委譲（Delegation）します。
     * 動的に追加される要素に対して非常に有効です。
     */
    onDelegateClick(
        parentAlias: Alias,
        childSelector: string,
        handler: (element: HTMLElement, index: number) => void,
    ): void {
        this.forEachElement(parentAlias, (parent) => {
            parent.addEventListener("click", (event) => {
                const target = (
                    event.target as HTMLElement
                ).closest<HTMLElement>(childSelector)

                if (target && parent.contains(target)) {
                    const index = Array.from(
                        parent.querySelectorAll<HTMLElement>(childSelector),
                    ).indexOf(target)

                    handler(target, index)
                }
            })
        })
    }

    // --- 内部ユーティリティ ---

    /**
     * Aliasに対応する要素群に対して共通の処理を実行します。
     */
    private forEachElement(
        alias: Alias,
        action: (el: HTMLElement, index: number) => void,
    ): void {
        const els = this.elements.get(alias)
        if (!els) {
            throw new Error(
                `Alias "${alias}" はまだロードされていないか、存在しません。先に load() を呼び出してください。`,
            )
        }
        els.forEach(action)
    }

    private validateCount(
        selector: string,
        elements: HTMLElement[],
        expected: number,
    ): void {
        if (elements.length === 0) {
            throw new Error(
                `Selector "${selector}" に一致する要素が見つかりませんでした。`,
            )
        }

        if (elements.length !== expected) {
            throw new Error(
                `Selector "${selector}" の個数が不正です。期待値: ${expected}, 実際: ${elements.length}`,
            )
        }
    }

    private checkAttributes(
        el: HTMLElement,
        attrs: Record<string, string>,
    ): void {
        for (const [key, pattern] of Object.entries(attrs)) {
            const value = el.getAttribute(key)
            if (value === null) {
                throw new Error(`要素は属性 "${key}" を持っていません。`)
            }

            const regex = new RegExp(`^${pattern}$`)
            if (!regex.test(value)) {
                console.error("Validation failed for element:", el)
                throw new Error(
                    `属性 "${key}" の値 "${value}" がパターン "${pattern}" に一致しません。`,
                )
            }
        }
    }
}
