import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    open: false,
    proxy: {
      "/api": "http://127.0.0.1:8080",
      "/static": "http://127.0.0.1:8080",
      "/chat": {
        target: "http://127.0.0.1:8888",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
