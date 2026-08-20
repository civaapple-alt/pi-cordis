#!/usr/bin/env node
import { spawn } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliTsPath = path.resolve(__dirname, "../packages/core/src/cli.ts");
const tsxPath = path.resolve(__dirname, "../node_modules/tsx/dist/cli.mjs");

const child = spawn(process.execPath, [tsxPath, cliTsPath, ...process.argv.slice(2)], {
	stdio: "inherit",
	env: process.env,
	cwd: process.cwd(),
});

child.on("exit", (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
	} else {
		process.exit(code ?? 0);
	}
});
