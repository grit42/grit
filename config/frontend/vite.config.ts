import { UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";

// https://vite.dev/config/
export default ({ mode }: any): UserConfig => ({
  plugins: [react()],
  resolve: {
    alias: {
      "use-sync-external-store/shim/with-selector.js":
        "use-sync-external-store/with-selector.js",
    },
  },
  css: {
    postcss: {
      plugins: [autoprefixer()],
    },
    modules: {
      localsConvention: "camelCase",
      generateScopedName:
        mode === "production"
          ? "[hash:base64:16]"
          : (name: any, filePath: any) => {
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
});
