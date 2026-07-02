import { defineConfig } from "vite"
// import Unplugin from "@typia/unplugin/vite"

export default defineConfig({
    base: "./",
    plugins: [],
    build: {
        target: ["esnext"],
        rollupOptions: {
            input: "src/main.ts",
            output: {
                entryFileNames: "main.js",
                dir: "dist/module",
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`,
            },
        },
        sourcemap: true,
    },
})
