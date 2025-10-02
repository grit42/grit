// vite.config.ts
import { defineConfig } from "file:///home/jacob/grit/node_modules/.pnpm/vite@5.4.14_@types+node@22.13.9_sass-embedded@1.85.1_sass@1.86.3_terser@5.39.0/node_modules/vite/dist/node/index.js";
import react from "file:///home/jacob/grit/node_modules/.pnpm/@vitejs+plugin-react@4.3.4_vite@5.4.14_@types+node@22.13.9_sass-embedded@1.85.1_sass@1.86.3_terser@5.39.0_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import dts from "file:///home/jacob/grit/node_modules/.pnpm/vite-plugin-dts@4.5.3_@types+node@22.13.9_rollup@4.34.9_typescript@5.6.3_vite@5.4.14_@t_702550555e823b1d215df5fba5c34320/node_modules/vite-plugin-dts/dist/index.mjs";
import { extname, relative, resolve } from "path";
import { glob } from "file:///home/jacob/grit/node_modules/.pnpm/glob@11.0.2/node_modules/glob/dist/esm/index.js";
import { fileURLToPath } from "node:url";
import { externalizeDeps } from "file:///home/jacob/grit/node_modules/.pnpm/vite-plugin-externalize-deps@0.9.0_vite@5.4.14_@types+node@22.13.9_sass-embedded@1.85.1_sass@1.86.3_terser@5.39.0_/node_modules/vite-plugin-externalize-deps/dist/index.js";
import autoprefixer from "file:///home/jacob/grit/node_modules/.pnpm/autoprefixer@10.4.20_postcss@8.5.3/node_modules/autoprefixer/lib/autoprefixer.js";
import { libInjectCss } from "file:///home/jacob/grit/node_modules/.pnpm/vite-plugin-lib-inject-css@2.2.2_vite@5.4.14_@types+node@22.13.9_sass-embedded@1.85.1_sass@1.86.3_terser@5.39.0_/node_modules/vite-plugin-lib-inject-css/dist/index.js";
var __vite_injected_original_dirname = "/home/jacob/grit/packages/frontend/api";
var __vite_injected_original_import_meta_url = "file:///home/jacob/grit/packages/frontend/api/vite.config.ts";
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [
    react(),
    libInjectCss(),
    dts({
      tsconfigPath: resolve(__vite_injected_original_dirname, "tsconfig.lib.json")
    }),
    externalizeDeps()
  ],
  build: {
    minify: false,
    copyPublicDir: false,
    rollupOptions: {
      input: Object.fromEntries(
        glob.sync("lib/**/*.{ts,tsx}", {
          ignore: ["lib/**/*.d.ts"]
        }).map((file) => [
          // The name of the entry point
          // lib/nested/foo.ts becomes nested/foo
          relative("lib", file.slice(0, file.length - extname(file).length)),
          // The absolute path to the entry file
          // lib/nested/foo.ts becomes /project/lib/nested/foo.ts
          fileURLToPath(new URL(file, __vite_injected_original_import_meta_url))
        ])
      ),
      output: {
        assetFileNames: "assets/[name][extname]",
        entryFileNames: "[name].js"
      }
    },
    lib: {
      entry: resolve(__vite_injected_original_dirname, "lib/main.tsx"),
      formats: ["es"]
    }
  },
  css: {
    postcss: {
      plugins: [autoprefixer()]
    },
    modules: {
      localsConvention: "camelCase",
      generateScopedName: mode === "production" ? "[hash:base64:16]" : (name, filePath) => {
        const fileName = filePath.split("/").pop()?.split(".")[0];
        return `grit-${fileName}__${name}`;
      }
    },
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9qYWNvYi9ncml0L3BhY2thZ2VzL2Zyb250ZW5kL2FwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvamFjb2IvZ3JpdC9wYWNrYWdlcy9mcm9udGVuZC9hcGkvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvamFjb2IvZ3JpdC9wYWNrYWdlcy9mcm9udGVuZC9hcGkvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IGR0cyBmcm9tIFwidml0ZS1wbHVnaW4tZHRzXCI7XG5pbXBvcnQgeyBleHRuYW1lLCByZWxhdGl2ZSwgcmVzb2x2ZSB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBnbG9iIH0gZnJvbSBcImdsb2JcIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwibm9kZTp1cmxcIjtcbmltcG9ydCB7IGV4dGVybmFsaXplRGVwcyB9IGZyb20gJ3ZpdGUtcGx1Z2luLWV4dGVybmFsaXplLWRlcHMnXG5pbXBvcnQgYXV0b3ByZWZpeGVyIGZyb20gXCJhdXRvcHJlZml4ZXJcIjtcbmltcG9ydCB7IGxpYkluamVjdENzcyB9IGZyb20gXCJ2aXRlLXBsdWdpbi1saWItaW5qZWN0LWNzc1wiXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoe21vZGV9KSA9PiAoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBsaWJJbmplY3RDc3MoKSxcbiAgICBkdHMoe1xuICAgICAgdHNjb25maWdQYXRoOiByZXNvbHZlKF9fZGlybmFtZSwgXCJ0c2NvbmZpZy5saWIuanNvblwiKSxcbiAgICB9KSxcbiAgICBleHRlcm5hbGl6ZURlcHMoKSxcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICBtaW5pZnk6IGZhbHNlLFxuICAgIGNvcHlQdWJsaWNEaXI6IGZhbHNlLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGlucHV0OiBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgICAgIGdsb2JcbiAgICAgICAgICAuc3luYyhcImxpYi8qKi8qLnt0cyx0c3h9XCIsIHtcbiAgICAgICAgICAgIGlnbm9yZTogW1wibGliLyoqLyouZC50c1wiXSxcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5tYXAoKGZpbGUpID0+IFtcbiAgICAgICAgICAgIC8vIFRoZSBuYW1lIG9mIHRoZSBlbnRyeSBwb2ludFxuICAgICAgICAgICAgLy8gbGliL25lc3RlZC9mb28udHMgYmVjb21lcyBuZXN0ZWQvZm9vXG4gICAgICAgICAgICByZWxhdGl2ZShcImxpYlwiLCBmaWxlLnNsaWNlKDAsIGZpbGUubGVuZ3RoIC0gZXh0bmFtZShmaWxlKS5sZW5ndGgpKSxcbiAgICAgICAgICAgIC8vIFRoZSBhYnNvbHV0ZSBwYXRoIHRvIHRoZSBlbnRyeSBmaWxlXG4gICAgICAgICAgICAvLyBsaWIvbmVzdGVkL2Zvby50cyBiZWNvbWVzIC9wcm9qZWN0L2xpYi9uZXN0ZWQvZm9vLnRzXG4gICAgICAgICAgICBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoZmlsZSwgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICAgXSlcbiAgICAgICksXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6IFwiYXNzZXRzL1tuYW1lXVtleHRuYW1lXVwiLFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogXCJbbmFtZV0uanNcIixcbiAgICAgIH0sXG4gICAgfSxcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiByZXNvbHZlKF9fZGlybmFtZSwgXCJsaWIvbWFpbi50c3hcIiksXG4gICAgICBmb3JtYXRzOiBbXCJlc1wiXSxcbiAgICB9LFxuICB9LFxuICBjc3M6IHtcbiAgICBwb3N0Y3NzOiB7XG4gICAgICBwbHVnaW5zOiBbYXV0b3ByZWZpeGVyKCldLFxuICAgIH0sXG4gICAgbW9kdWxlczoge1xuICAgICAgbG9jYWxzQ29udmVudGlvbjogXCJjYW1lbENhc2VcIixcbiAgICAgIGdlbmVyYXRlU2NvcGVkTmFtZTpcbiAgICAgICAgbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCJcbiAgICAgICAgICA/IFwiW2hhc2g6YmFzZTY0OjE2XVwiXG4gICAgICAgICAgOiAobmFtZTogc3RyaW5nLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGZpbGVOYW1lID0gZmlsZVBhdGguc3BsaXQoXCIvXCIpLnBvcCgpPy5zcGxpdChcIi5cIilbMF07XG5cbiAgICAgICAgICAgICAgcmV0dXJuIGBncml0LSR7ZmlsZU5hbWV9X18ke25hbWV9YDtcbiAgICAgICAgICAgIH0sXG4gICAgfSxcbiAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICBzY3NzOiB7XG4gICAgICAgIGFwaTogXCJtb2Rlcm4tY29tcGlsZXJcIixcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBb1MsU0FBUyxvQkFBb0I7QUFDalUsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sU0FBUztBQUNoQixTQUFTLFNBQVMsVUFBVSxlQUFlO0FBQzNDLFNBQVMsWUFBWTtBQUNyQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHVCQUF1QjtBQUNoQyxPQUFPLGtCQUFrQjtBQUN6QixTQUFTLG9CQUFvQjtBQVI3QixJQUFNLG1DQUFtQztBQUEySSxJQUFNLDJDQUEyQztBQVVyTyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFDLEtBQUksT0FBTztBQUFBLEVBQ3ZDLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLGFBQWE7QUFBQSxJQUNiLElBQUk7QUFBQSxNQUNGLGNBQWMsUUFBUSxrQ0FBVyxtQkFBbUI7QUFBQSxJQUN0RCxDQUFDO0FBQUEsSUFDRCxnQkFBZ0I7QUFBQSxFQUNsQjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLElBQ2YsZUFBZTtBQUFBLE1BQ2IsT0FBTyxPQUFPO0FBQUEsUUFDWixLQUNHLEtBQUsscUJBQXFCO0FBQUEsVUFDekIsUUFBUSxDQUFDLGVBQWU7QUFBQSxRQUMxQixDQUFDLEVBQ0EsSUFBSSxDQUFDLFNBQVM7QUFBQTtBQUFBO0FBQUEsVUFHYixTQUFTLE9BQU8sS0FBSyxNQUFNLEdBQUcsS0FBSyxTQUFTLFFBQVEsSUFBSSxFQUFFLE1BQU0sQ0FBQztBQUFBO0FBQUE7QUFBQSxVQUdqRSxjQUFjLElBQUksSUFBSSxNQUFNLHdDQUFlLENBQUM7QUFBQSxRQUM5QyxDQUFDO0FBQUEsTUFDTDtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsSUFDQSxLQUFLO0FBQUEsTUFDSCxPQUFPLFFBQVEsa0NBQVcsY0FBYztBQUFBLE1BQ3hDLFNBQVMsQ0FBQyxJQUFJO0FBQUEsSUFDaEI7QUFBQSxFQUNGO0FBQUEsRUFDQSxLQUFLO0FBQUEsSUFDSCxTQUFTO0FBQUEsTUFDUCxTQUFTLENBQUMsYUFBYSxDQUFDO0FBQUEsSUFDMUI7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLGtCQUFrQjtBQUFBLE1BQ2xCLG9CQUNFLFNBQVMsZUFDTCxxQkFDQSxDQUFDLE1BQWMsYUFBcUI7QUFDbEMsY0FBTSxXQUFXLFNBQVMsTUFBTSxHQUFHLEVBQUUsSUFBSSxHQUFHLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFFeEQsZUFBTyxRQUFRLFFBQVEsS0FBSyxJQUFJO0FBQUEsTUFDbEM7QUFBQSxJQUNSO0FBQUEsSUFDQSxxQkFBcUI7QUFBQSxNQUNuQixNQUFNO0FBQUEsUUFDSixLQUFLO0FBQUEsTUFDUDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
