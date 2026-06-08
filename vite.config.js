import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api/football": {
          target: "https://api.football-data.org/v4",
          rewrite: (path) => path.replace(/^\/api\/football/, ""),
          changeOrigin: true,
          headers: { "X-Auth-Token": env.API_FOOTBALL_KEY },
        },
      },
    },
  };
});
