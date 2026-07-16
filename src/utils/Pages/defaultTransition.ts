import { TransitionArgs } from "./Pages"
import { parseToNumber } from "./parseToNumber"

export function defaultTransition(from: HTMLElement, to: HTMLElement, msIn: number, msOut: number): TransitionArgs {
    const layerFrom = parseToNumber(from?.dataset.layer, 0)
    const layerTo = parseToNumber(to?.dataset.layer, 0)

    if (layerFrom === layerTo) {
        return {
            from: async () => {
                const fromAnimation = from.animate([{ opacity: 1 }, { opacity: 0 }], {
                    duration: msOut,
                    fill: "forwards",
                })
                await fromAnimation.finished
            },
            to: async () => {
                const toAnimation = to.animate([{ opacity: 0 }, { opacity: 1 }], {
                    duration: msIn,
                    fill: "forwards",
                })
                await toAnimation.finished
            },
        }
    } else if (layerFrom < layerTo) {
        return {
            from: async () => {},
            to: async () => {
                const toAnimation = to.animate([{ opacity: 0 }, { opacity: 1 }], {
                    duration: msIn,
                    fill: "forwards",
                })
                await toAnimation.finished
            },
        }
    } else {
        return {
            from: async () => {
                const fromAnimation = from.animate([{ opacity: 1 }, { opacity: 0 }], {
                    duration: msOut,
                    fill: "forwards",
                })
                await fromAnimation.finished
            },
            to: async () => {},
        }
    }
}
