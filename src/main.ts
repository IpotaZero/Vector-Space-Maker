import { Dom } from "./Dom.js"
import { SceneChanger } from "./utils/Scene/SceneChanger.js"
import { SceneTitle } from "./Scene/SceneTitle.js"
import { Focuses } from "@ipota/focuses"
import { DigitalInput } from "@ipota/input"
import { Pages } from "@ipota/pages"

export const input = new DigitalInput({
    up: ["ArrowUp", "KeyW", "gamepad-axis-1-negative"],
    down: ["ArrowDown", "KeyS", "gamepad-axis-1-positive"],
    left: ["ArrowLeft", "KeyA", "gamepad-axis-0-negative"],
    right: ["ArrowRight", "KeyD", "gamepad-axis-0-positive"],
    jump: ["ArrowUp", "KeyW", "Space", "gamepad-button-0"],
    fire: ["KeyZ"],

    ok: ["Enter", "KeyZ", "Space", "gamepad-button-0"],
    cancel: ["KeyX", "Escape", "Backspace", "gamepad-button-1"],
    pause: ["Escape", "KeyP", "gamepad-button-9"],
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
    input.clear()
    focuses.clearMemory()
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
