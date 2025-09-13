import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ command, mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "gamingappfrontend.onrender.com", // 👈 add your Render host here
      "gamingappfrontend-2.onrender.com",
      "https://gamingappfrontend.onrender.com"
    ],
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  plugins: [
    react(),
  ],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
