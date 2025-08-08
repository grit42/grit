import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import libConfig from "../../vite.config";
import { resolve } from "path";

export default defineConfig(({ mode, ...rest }) => ({
  ...libConfig({ mode, ...rest }),
    resolve: {
    alias: {
      "@grit42/assays/meta": resolve(__dirname, "../../lib/meta.ts"),
      "@grit42/assays/registrant": resolve(
        __dirname,
        "../../lib/Registrant.tsx",
      ),
      "@grit42/assays/router": resolve(__dirname, "../../lib/Router.tsx"),
      "@grit42/assays/provider": resolve(__dirname, "../../lib/Provider.tsx"),
    },
  },
  server: {
    strictPort: true,
    proxy: {
      "/api": {
        target: `http://localhost:3000/`,
        changeOrigin: false,
      },
    },
  },
  plugins: [react()]
}));
