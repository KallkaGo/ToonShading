import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import react from "@vitejs/plugin-react";
import path from "path";

const isCodeSandbox =
    "SANDBOX_URL" in process.env || "CODESANDBOX_HOST" in process.env;

// https://vitejs.dev/config/
export default defineConfig({
    base: "./",
    publicDir:'./public',
    assetsInclude: ["**/*.glb", "**/*.hdr", "**/*.mp3", "**/*.ico"],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src/"),
            "@textures": path.resolve(__dirname, "./static/textures/"),
            "@models": path.resolve(__dirname, "./static/models/"),
            "@images": path.resolve(__dirname, "./static/images/"),
            "@audios": path.resolve(__dirname, "./static/audios/"),
            "@utils": path.resolve(__dirname, "./src/utils/"),
        },
    },
    server: {
        host: true,
        open: !isCodeSandbox, // Open if it's not a CodeSandbox
        port: 2333,
    },
    plugins: [
        glsl({
            compress: true,
            watch: true,
        }),
        react(),
    ],

    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ["react", "react-dom"],
                    gsap: ["gsap", "@gsap/react"],
                    three: ["three"],
                    r3f: [
                        "@react-three/fiber",
                        "@react-three/drei",
                        "r3f-perf",
                    ],
                    chunk: ["leva", "@wtto00/jweixin-esm", "dingtalk-jsapi"],
                    pp: ["@react-three/postprocessing", "postprocessing"],
                },
            },
        },
    },
});
