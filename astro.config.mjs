import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://brunostrapazzon.github.io",
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "always" },
  compressHTML: true,
  devToolbar: { enabled: false },
});
