import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  compressHTML: false,
  dev: {
    inlineStylesheets: "never"
  },
  vite: {
    dev: {
      minify: false,
    },
  },
});
