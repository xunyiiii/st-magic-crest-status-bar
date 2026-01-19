import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react(), viteSingleFile()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      // 禁用 CSS 分离，将 CSS 内联到 HTML 中
      cssCodeSplit: false,
      // 禁用 sourcemap，避免生成额外的 .map 文件
      sourcemap: false,
      // 可选：压缩打包后的代码（Vite 默认开启，可显式声明）
      minify: "esbuild",
      // 单文件打包的关键配置：将所有资源内联
      assetsInlineLimit: 100000000,
      rollupOptions: {
        output: {
          // 确保打包后的文件只有一个 HTML（无独立 JS/CSS）
          inlineDynamicImports: true,
          // 禁用代码混淆（保留原始变量名）
          mangler: false,
          // 禁用代码拆分（单文件打包已配置，此处强化）
          format: "iife",
          // 保留注释（可选）
          preserveComments: "all",
        },
      },
    },
  };
});
