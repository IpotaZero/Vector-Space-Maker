import { Dom } from "./Dom.js"
import { SceneChanger } from "./utils/Scene/SceneChanger.js"
import { SceneTitle } from "./Scene/SceneTitle.js"
import { Focuses } from "./utils/Focuses/Focuses.js"
import { DigitalInput } from "./utils/Input/DigitalInput.js"
import { Pages } from "./utils/Pages/Pages.js"

export const input = new DigitalInput({
    up: ["ArrowUp", "KeyW"],
    down: ["ArrowDown", "KeyS"],
    left: ["ArrowLeft", "KeyA"],
    right: ["ArrowRight", "KeyD"],
    jump: ["ArrowUp", "KeyW", "Space"],

    ok: ["Enter", "KeyZ", "Space"],
    cancel: ["KeyX", "Escape", "Backspace"],
    pause: ["Escape", "KeyP"],
})

Dom.init()

export const focuses = new Focuses(input)

export const sc = new SceneChanger(Dom.container)
sc.goto(new SceneTitle())

sc.onTransitionStart = () => {
    input.pause("scene-transition")
}

sc.onTransitionEnd = () => {
    input.resume("scene-transition")
}

Pages.onTransitionStart = () => {
    input.pause("page-transition")
}

Pages.onTransitionEnd = (pages) => {
    input.resume("page-transition")
    focuses.setPage(pages.getCurrentPage())
}

const update = () => {
    sc.update()
    focuses.update()
    input.update()

    requestAnimationFrame(update)
}

requestAnimationFrame(update)

window.addEventListener("keydown", (e) => {
    if (["Tab", "Enter"].includes(e.code)) e.preventDefault()
})
