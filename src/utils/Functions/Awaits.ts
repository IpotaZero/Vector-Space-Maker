export class Awaits {
    static sleep<T>(ms: number) {
        return new Promise<T>((resolve) => {
            setTimeout(resolve, ms)
        })
    }

    static ok() {
        const abort = new AbortController()

        return new Promise<void>((resolve) => {
            document.addEventListener(
                "click",
                () => {
                    abort.abort()
                    resolve()
                },
                { signal: abort.signal },
            )

            document.addEventListener(
                "keydown",
                (e) => {
                    if (["KeyZ", "Enter", "Space"].includes(e.code)) {
                        abort.abort()
                        resolve()
                    }
                },
                { signal: abort.signal },
            )
        })
    }

    static key() {
        const abort = new AbortController()

        return new Promise<void>((resolve) => {
            document.addEventListener(
                "click",
                () => {
                    abort.abort()
                    resolve()
                },
                { signal: abort.signal },
            )

            document.addEventListener(
                "keydown",
                (e) => {
                    abort.abort()
                    resolve()
                },
                { signal: abort.signal },
            )
        })
    }

    static frame(fn = () => {}) {
        return new Promise<void>((resolve) =>
            requestAnimationFrame(() => {
                fn()
                resolve()
            }),
        )
    }

    static async timeout<T>(
        ms: number,
        promise: Promise<T>,
    ): Promise<T | "timeout"> {
        return Promise.race([
            promise,
            Awaits.sleep(ms).then(() => "timeout" as const),
        ])
    }

    static async loading<T>(
        ms: number,
        promise: Promise<T>,
        whenOver: () => void,
    ) {
        let done = false
        let over = false

        Awaits.sleep(ms).then(() => {
            if (!done) {
                over = true
                whenOver()
            }
        })

        const value = await promise
        done = true

        return { value, over }
    }

    static async waitElementReady(container: Element): Promise<void> {
        type ElementWithReady = Element & { ready: Promise<unknown> }

        const hasReadyPromise = Array.from(
            container.querySelectorAll("*"),
        ).filter((e: any): e is ElementWithReady => e.ready instanceof Promise)

        await Promise.all(hasReadyPromise.map((e) => e.ready))
    }

    static async waitCSSLoad(container: Element): Promise<void> {
        const links = Array.from(
            container.querySelectorAll<HTMLLinkElement>(
                'link[rel="stylesheet"]',
            ),
        )

        await Promise.all(
            links.map((link) => {
                if (link.sheet) return Promise.resolve() // すでに読み込み済み
                return new Promise<void>((resolve) => {
                    link.onload = () => resolve()
                    link.onerror = () => resolve() // エラー時も進めるようにする
                })
            }),
        )
    }

    static inputFile(extension: string) {
        // 1. ファイルを選択するための隠し input 要素を作成
        const input = document.createElement("input")
        input.type = "file"
        input.accept = extension

        return new Promise<File | null>((resolve) => {
            // 2. ファイルが選択された時の処理
            input.onchange = async () => {
                const file = input.files?.[0]
                if (!file) {
                    resolve(null)
                    return
                }

                resolve(file)
            }

            // 3. ファイル選択ダイアログを表示
            input.click()
        })
    }
}
