import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.js"],
  outDir: "./dist",
  splitting: true,
  sourcemap: true,
  format: ["esm"],
  bundle: true,
  treeshake: true,
  clean: true,
});
