class SE {
    constructor(readonly audio: HTMLAudioElement) {}

    play() {
        this.audio.currentTime = 0
        this.audio.play()
    }

    static create(url: string): Promise<SE> {
        const audio = new Audio(url)

        return new Promise((resolve, reject) => {
            audio.addEventListener("canplaythrough", () => {
                resolve(new SE(audio))
            })
            audio.addEventListener("error", (e) => {
                reject(e)
            })
        })
    }
}

export class se {
    static jump: SE
    static doubleJump: SE

    static async load() {
        ;[this.jump, this.doubleJump] = await Promise.all([
            SE.create("assets/se/jump.mp3"),
            SE.create("assets/se/double-jump.mp3"),
        ])
    }
}
