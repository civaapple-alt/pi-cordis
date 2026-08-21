import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/cli.ts"],
	outDir: "dist",
	format: ["esm"],
	platform: "node",
	target: "node22.19",
	fixedExtension: false,
	dts: true,
	sourcemap: true,
	clean: true,
});
