import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/gyms": "http://localhost:3000",
      "/routes": "http://localhost:3000",
      "/memberships": "http://localhost:3000",
    },
  },
});
