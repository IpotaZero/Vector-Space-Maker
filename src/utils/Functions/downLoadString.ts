export function downLoadString(string: string, defaultName: string) {
    // 2. ユーザーにファイル名を決めてもらう
    // キャンセルされたら終了
    const fileName = window.prompt("保存するファイルを命名しよう", defaultName)
    if (fileName === null) return

    // 3. JSONをBlob（塊）に変換
    const blob = new Blob([string])

    // 4. ダウンロード用のリンクを「メモリ上」に作成
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")

    a.href = url
    a.download = `${fileName}.json` // 拡張子を付ける

    // 5. リンクを自動クリックしてダウンロード開始
    a.click()

    // 6. 後片付け
    URL.revokeObjectURL(url) // メモリを解放
}
