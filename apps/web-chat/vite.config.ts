import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,

    // Permite abrir Vite mediante el hostname temporal de Cloudflare.
    allowedHosts: [".trycloudflare.com"],

    // El navegador llama al mismo dominio usando /public/*.
    // Vite reenvía internamente esas solicitudes a Agent Core.
    proxy: {
      "/public": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
        headers: {
          Origin: "http://127.0.0.1:5173"
        }
      }
    }
  }
});
