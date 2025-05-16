import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";

export default defineConfig(({mode}) => ({
  plugins: [
    react(),
  ],
  css: {
    postcss: {
      plugins: [autoprefixer()],
    },
    modules: {
      localsConvention: "camelCase",
      generateScopedName:
        mode === "production"
          ? "[hash:base64:16]"
          : (name: string, filePath: string) => {
              const fileName = filePath.split("/").pop()?.split(".")[0];

              return `grit-${fileName}__${name}`;
            },
    },
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
  },
}));
