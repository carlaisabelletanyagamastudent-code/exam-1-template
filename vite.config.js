import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/napi": {
        target: "https://unsplash.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
