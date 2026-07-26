import { Dom } from "./Dom.js"
import { SceneChanger } from "./utils/Scene/SceneChanger.js"
import { Focuses } from "@ipota/focuses"
import { Pages } from "@ipota/pages"
import { looper } from "./looper.js"
import { input } from "./input.js"
import { se } from "./se.js"

document.addEventListener("DOMContentLoaded", async () => {
    await se.load()

    looper.start()

    sc.goto(async () => await import("./Scene/SceneTitle.js").then(({ SceneTitle }) => new SceneTitle()))
})

export const focuses = new Focuses(input)

Dom.init()
export const sc = new SceneChanger(Dom.container)

sc.onTransitionStart = () => {
    input.pause("scene-transition")
}

sc.onTransitionEnd = () => {
    input.resume("scene-transition")
    input.clear()
    focuses.clearMemory()
}

looper.addHandler((timeScale) => {
    sc.update()
    focuses.update()
    input.update()
})

window.addEventListener("keydown", (e) => {
    if (["Tab", "Enter"].includes(e.code)) e.preventDefault()
})

window.addEventListener("contextmenu", (e) => {
    e.preventDefault()
})

export function focusesUpdater(pages: Pages) {
    pages.onTransitionStart(() => {
        input.pause("page-transition")
    })

    pages.onTransitionEnd((pages) => {
        input.resume("page-transition")
    })

    pages.onJustEnter(".*", (pages) => {
        focuses.setPage(pages.getCurrentPage())
    })

    pages.onBack(() => {
        focuses.setPage(pages.getCurrentPage(), true)
    })
}
