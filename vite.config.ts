import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: resolve(__dirname, "tsconfig.lib.json"),
    }),
  ],
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      name: "cashu-react",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["react", "react/jsx-runtime"],
    },
  },
});
