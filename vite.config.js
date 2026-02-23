import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // dev: "/"  ; build(GitHub Pages): "/CASA0028_Assessment1/"
  base: mode === "production" ? "/CASA0028_Assessment1/" : "/",
}));