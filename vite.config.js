import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import adminAuthHandler from "./server/admin-auth-handler.js";
import announcementHandler from "./server/announcement-handler.js";
import siteThemeHandler from "./server/site-theme-handler.js";
import hotMoviesHandler from "./server/hot-movies-handler.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      {
        name: "local-admin-auth",
        configureServer(server) {
          for (const key of ["ADMIN_USERNAME", "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]) {
            if (env[key]) process.env[key] = env[key];
          }
          server.middlewares.use("/api/admin-auth", (req, res) => adminAuthHandler(req, res));
          server.middlewares.use("/api/announcement", (req, res) => announcementHandler(req, res));
          server.middlewares.use("/api/site-theme", (req, res) => siteThemeHandler(req, res));
          server.middlewares.use("/api/hot-movies", (req, res) => hotMoviesHandler(req, res));
        },
      },
    ],
  };
});
