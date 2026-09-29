import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages serves this repository from a subpath, not the domain root.
  base: "/digital-dartboard/",
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
