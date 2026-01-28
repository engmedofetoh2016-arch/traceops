import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": {
        target: "https://localhost:7080",
        changeOrigin: true,
        secure: false,
      },
      "/v1": {
        target: "https://localhost:7080",
        changeOrigin: true,
        secure: false,
      },
      "/dev": {
        target: "https://localhost:7080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
