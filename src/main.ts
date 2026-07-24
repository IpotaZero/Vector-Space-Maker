import { Dom } from "./Dom.js"
import { SceneChanger } from "./utils/Scene/SceneChanger.js"
import { Focuses } from "@ipota/focuses"
import { Pages } from "@ipota/pages"
import { looper } from "./looper.js"
import { input } from "./input.js"

Dom.init()

export const focuses = new Focuses(input)

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

looper.start()

window.addEventListener("keydown", (e) => {
    if (["Tab", "Enter"].includes(e.code)) e.preventDefault()
})

document.addEventListener("DOMContentLoaded", async () => {
    sc.goto(async () => await import("./Scene/SceneTitle.js").then(({ SceneTitle }) => new SceneTitle()))
})

export function focusesUpdater(pages: Pages) {
    console.log(pages)

    pages.onTransitionStart(() => {
        input.pause("page-transition")
    })

    pages.onTransitionEnd(async (pages) => {
        input.resume("page-transition")
        focuses.setPage(pages.getCurrentPage())
    })
}
