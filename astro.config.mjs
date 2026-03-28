import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://hiziriex.github.io",
  base: "/lab",
  output: "static",
  compressHTML: false,
  build: {
    inlineStylesheets: "never",
  },
  vite: {
    build: {
      minify: false,
    },
  },
});