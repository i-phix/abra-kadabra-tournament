export default {
  server: {
    proxy: {
      "/api/football": {
        target: "https://api.football-data.org/v4",
        rewrite: (path) => path.replace(/^\/api\/football/, ""),
        changeOrigin: true,
        headers: { "X-Auth-Token": "0d73bad5c3114f288747caef2d389819" },
      },
    },
  },
};
