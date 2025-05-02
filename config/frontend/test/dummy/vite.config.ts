import base from "../../vite.config";

// https://vite.dev/config/
export default ({ mode }: any) => ({
  ...base(mode),
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:3000/`,
        changeOrigin: false,
      },
    },
  },
});
