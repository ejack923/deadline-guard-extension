import { resolve } from "node:path";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "extension-manifest",
      writeBundle() {
        const distDir = resolve(__dirname, "dist");
        mkdirSync(distDir, { recursive: true });

        const manifestPath = resolve(__dirname, "manifest.json");
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

        manifest.background.service_worker = "background.js";
        manifest.action.default_popup = "popup.html";
        manifest.options_page = "options.html";
        manifest.content_scripts = manifest.content_scripts.map((script: { js?: string[] }) => ({
          ...script,
          js: ["atlas-page.js"]
        }));

        writeFileSync(resolve(distDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
      }
    }
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        options: resolve(__dirname, "src/options/index.html"),
        background: resolve(__dirname, "src/background/index.ts"),
        "atlas-page": resolve(__dirname, "src/content/atlas-page.ts")
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    }
  }
});
