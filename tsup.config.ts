import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["opt/index.cjs"],
  outDir: "./dist",
  splitting: true,
  sourcemap: true,
  dts: true,
  format: ["esm"],
  bundle: true,
  treeshake: true,
  clean: true,
});
