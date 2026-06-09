import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { extname, relative, resolve } from "path";
import { glob } from "glob";
import { fileURLToPath } from "node:url";
import { externalizeDeps } from "vite-plugin-externalize-deps";
import autoprefixer from "autoprefixer";
import { libInjectCss } from "vite-plugin-lib-inject-css";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    libInjectCss(),
    dts({
      tsconfigPath: resolve(__dirname, "tsconfig.lib.json"),
    }),
    externalizeDeps(),
  ],
  build: {
    minify: false,
    copyPublicDir: false,
    rollupOptions: {
      input: Object.fromEntries(
        glob
          .sync("lib/**/*.{ts,tsx}", {
            ignore: ["lib/**/*.d.ts"],
          })
          .map((file) => [
            // The name of the entry point
            // lib/nested/foo.ts becomes nested/foo
            relative("lib", file.slice(0, file.length - extname(file).length)),
            // The absolute path to the entry file
            // lib/nested/foo.ts becomes /project/lib/nested/foo.ts
            fileURLToPath(new URL(file, import.meta.url)),
          ]),
      ),
      output: {
        assetFileNames: "assets/[name][extname]",
        entryFileNames: "[name].js",
      },
    },
    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      formats: ["es"],
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
          : (name: string, filePath: string) => {
              const fileName = filePath.split("/").pop()?.split(".")[0];

              return `grit-${fileName}__${name}`;
            },
    },
  },
  resolve: {
    alias: {
      "@grit42/core": resolve(__dirname, "./lib"),
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./test/setup.ts",
    exclude: ["test/e2e/**", "test/playwright/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["lib/**/*.{ts,tsx}"],
      exclude: ["lib/**/*.d.ts", "lib/**/index.ts"],
      // Disable thresholds initially - will enable after Phase 3
      // thresholds: {
      //   lines: 80,
      //   functions: 80,
      //   branches: 70,
      //   statements: 80,
      // },
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
