import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import libConfig from "../../vite.config";

export default defineConfig(({ mode, ...rest }) => ({
  ...libConfig({ mode, ...rest }),
  plugins: [react()],
  resolve: {
    alias: {
      "@grit42/core/meta": resolve(__dirname, "../../lib/meta.ts"),
      "@grit42/core/registrant": resolve(__dirname, "../../lib/Registrant.tsx"),
      "@grit42/core/router": resolve(__dirname, "../../lib/Router.tsx"),
      "@grit42/core/provider": resolve(__dirname, "../../lib/Provider.tsx"),
      "@grit42/core/utils": resolve(__dirname, "../../lib/utils/index.ts"),
      "@grit42/core/Header": resolve(
        __dirname,
        "../../lib/components/Header/index.tsx",
      ),
      "@grit42/core/Toolbar": resolve(__dirname, "../../lib/Toolbar/index.ts"),
      "@grit42/core": resolve(__dirname, "../../lib/index.ts"),
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
}));
