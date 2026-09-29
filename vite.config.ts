import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) =>
          /node_modules[/\\]three[/\\]/.test(id) ? "three" : undefined,
      },
    },
  },
});
