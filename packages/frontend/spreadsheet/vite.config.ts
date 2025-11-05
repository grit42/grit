import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { extname, relative, resolve } from "path";
import { glob } from "glob";
import { fileURLToPath } from "node:url";
import { externalizeDeps } from 'vite-plugin-externalize-deps'

export default defineConfig(({mode}) => ({
  plugins: [
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
          ])
      ),
      output: {
        assetFileNames: "assets/[name][extname]",
        entryFileNames: "[name].js",
      },
    },
    lib: {
      entry: resolve(__dirname, "lib/main.tsx"),
      formats: ["es"],
    },
  },
  css: {
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
