import { Pages, TransitionArgs } from "./Pages"

export function defaultTransition(layerFrom: number, layerTo: number, msIn: number, msOut: number): TransitionArgs {
    if (layerFrom === layerTo) {
        return {
            from: async ({ from }) => {
                const fromAnimation = from.animate([{ opacity: 1 }, { opacity: 0 }], {
                    duration: msOut,
                    fill: "forwards",
                })
                await fromAnimation.finished
            },
            to: async ({ to }) => {
                to.classList.remove(Pages.hiddenClass)
                const toAnimation = to.animate([{ opacity: 0 }, { opacity: 1 }], {
                    duration: msIn,
                    fill: "forwards",
                })
                await toAnimation.finished
            },
            last: async ({ from, to }) => {
                from.classList.add(Pages.hiddenClass)
                to.classList.remove(Pages.hiddenClass)
            },
        }
    } else if (layerFrom < layerTo) {
        return {
            from: async () => {},
            to: async ({ to }) => {
                to.classList.remove(Pages.hiddenClass)
                const toAnimation = to.animate([{ opacity: 0 }, { opacity: 1 }], {
                    duration: msIn,
                    fill: "forwards",
                })
                await toAnimation.finished
            },
            last: async ({ to }) => {
                to.classList.remove(Pages.hiddenClass)
            },
        }
    } else {
        return {
            from: async ({ from }) => {
                const fromAnimation = from.animate([{ opacity: 1 }, { opacity: 0 }], {
                    duration: msOut,
                    fill: "forwards",
                })
                await fromAnimation.finished
            },
            to: async ({ to }) => {
                to.classList.remove(Pages.hiddenClass)
            },
            last: async ({ from }) => {
                from.classList.add(Pages.hiddenClass)
            },
        }
    }
}
