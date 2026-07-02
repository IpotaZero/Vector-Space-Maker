import { Awaits } from "./Awaits"

export class Transition {
    static async fadeOut(container: HTMLElement, ms: number = 200) {
        if (ms === 0) {
            container.style.transition = "opacity 0s"
            container.style.opacity = "0"
            container.style.pointerEvents = "none"
            return
        }

        container.style.transition = "opacity 0s"
        container.style.pointerEvents = "none"

        await Awaits.frame(() => {
            container.style.opacity = "1"
        })

        await Awaits.frame(() => {
            container.style.transition = `opacity ${ms}ms`
            container.style.opacity = "0"
        })

        await Awaits.sleep(ms)
    }

    static async fadeIn(container: HTMLElement, ms: number = 200) {
        if (ms === 0) {
            container.style.transition = "opacity 0s"
            container.style.opacity = "1"
            container.style.pointerEvents = ""
            return
        }

        container.style.opacity = "0"
        container.style.transition = "opacity 0s"
        container.style.pointerEvents = "none"

        await Awaits.frame(() => {
            container.style.opacity = "0"
        })

        await Awaits.frame(() => {
            container.style.transition = `opacity ${ms}ms`
            container.style.opacity = "1"
        })

        await Awaits.sleep(ms)

        await Awaits.frame(() => {
            container.style.pointerEvents = ""
        })
    }

    static async valeOut(container: HTMLElement, ms: number = 200) {
        container.style.pointerEvents = "none"

        const vale = document.createElement("div")
        vale.classList.add("vale")
        vale.style.transition = `left ${ms}ms cubic-bezier(0.37, 0, 0.63, 1)`

        document.body.appendChild(vale)

        await Awaits.frame()

        await Awaits.frame(() => {
            vale.style.left = "0"
        })

        await Awaits.sleep(ms)
    }

    static async valeIn(container: HTMLElement, ms: number = 200) {
        const vale = document.querySelector<HTMLDivElement>(".vale")
        if (!vale) return
        vale.style.transition = `left ${ms}ms cubic-bezier(0.12, 0, 0.39, 0)`

        await Awaits.frame(() => {
            vale.style.left = "calc(100dvw + 4em)"
        })
        await Awaits.sleep(ms)

        document.body.removeChild(vale)

        container.style.pointerEvents = ""
    }
}
