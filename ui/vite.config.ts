import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          mantine: [
            "@mantine/core",
            "@mantine/form",
            "@mantine/hooks",
            "@mantine/notifications",
          ],
          codemirror: [
            "@uiw/react-codemirror",
            "@uiw/codemirror-themes",
            "@codemirror/lang-yaml",
            "@lezer/highlight",
          ],
          icons: ["@tabler/icons-react"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "./src"),
    },
  },
});
