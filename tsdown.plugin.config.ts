import { defineConfig } from "tsdown";

export default defineConfig({
	cwd: process.cwd(),
	entry: ["src/index.ts"],
	outDir: "dist",
	format: ["esm"],
	platform: "node",
	target: "node22.19",
	fixedExtension: false,
	dts: true,
	sourcemap: true,
	clean: true,
});
