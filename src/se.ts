class SE {
    private currentSource: AudioBufferSourceNode | null = null

    constructor(
        private readonly context: AudioContext,
        private readonly buffer: AudioBuffer,
    ) {}

    play() {
        // 再生中の音があれば止める
        if (this.currentSource) {
            this.currentSource.stop()
            this.currentSource.disconnect()
            this.currentSource = null
        }

        const source = this.context.createBufferSource()
        source.buffer = this.buffer
        source.connect(this.context.destination)

        // 再生が最後まで終わったら参照をクリアする
        source.addEventListener("ended", () => {
            if (this.currentSource === source) {
                this.currentSource = null
            }
        })

        source.start(0)
        this.currentSource = source
    }

    static async create(context: AudioContext, url: string): Promise<SE> {
        const res = await fetch(url)
        const arrayBuffer = await res.arrayBuffer()
        const audioBuffer = await context.decodeAudioData(arrayBuffer)
        return new SE(context, audioBuffer)
    }
}

export class se {
    static jump: SE
    static doubleJump: SE
    static land: SE
    private static context: AudioContext

    static async load() {
        this.context = new AudioContext({ latencyHint: "interactive" })
        ;[this.jump, this.doubleJump, this.land] = await Promise.all([
            SE.create(this.context, "assets/se/jump.mp3"),
            SE.create(this.context, "assets/se/double-jump.mp3"),
            SE.create(this.context, "assets/se/landing.mp3"),
        ])
    }
}
