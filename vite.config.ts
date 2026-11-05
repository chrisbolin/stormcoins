import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // served from https://chrisbolin.co/stormcoins/
  base: "/stormcoins/",
  plugins: [react()],
  server: { port: 3000, strictPort: true },
  test: { environment: "jsdom" },
});
