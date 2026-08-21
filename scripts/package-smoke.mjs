import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL("..", import.meta.url));
const smokeRoot = mkdtempSync(join(tmpdir(), "picds-package-smoke-"));
const tarballDir = join(smokeRoot, "tarballs");
const installDir = join(smokeRoot, "install");

const packageDirs = [
	"packages/plugins/ask-question",
	"packages/plugins/btw",
	"packages/plugins/code-mode",
	"packages/plugins/git-automation",
	"packages/plugins/git-guard",
	"packages/plugins/output-truncator",
	"packages/plugins/plan-mode",
	"packages/plugins/profiles",
	"packages/plugins/rules-injector",
	"packages/plugins/safety-gate",
	"packages/plugins/session-handoff",
	"packages/plugins/terminal-notifier",
	"packages/plugins/todo-tracker",
	"packages/plugins/tools-manager",
	"packages/core",
];
const packageNames = packageDirs.map((packageDir) => (
	JSON.parse(readFileSync(join(workspaceRoot, packageDir, "package.json"), "utf8")).name
));

function run(command, args, options = {}) {
	const useCommandShim = process.platform === "win32" && command !== process.execPath;
	const executable = useCommandShim ? (process.env.ComSpec ?? "cmd.exe") : command;
	const commandLine = [`${command}.cmd`, ...args.map(quoteWindowsArg)].join(" ");
	const executableArgs = useCommandShim ? ["/d", "/c", commandLine] : args;
	const result = spawnSync(executable, executableArgs, {
		cwd: options.cwd ?? workspaceRoot,
		encoding: "utf8",
		stdio: options.capture ? "pipe" : "inherit",
	});
	if (result.status !== 0) {
		throw new Error(
			`${command} ${args.join(" ")} failed with exit code ${result.status}\n${result.stderr ?? ""}`,
		);
	}
	return result.stdout?.trim() ?? "";
}

function quoteWindowsArg(value) {
	const text = String(value);
	if (!/[\s"&|<>^]/.test(text)) return text;
	return `"${text.replaceAll('"', '""')}"`;
}

try {
	mkdirSync(tarballDir);
	mkdirSync(installDir);

	for (const packageDir of packageDirs) {
		run("pnpm", ["pack", "--pack-destination", tarballDir], {
			cwd: join(workspaceRoot, packageDir),
			capture: true,
		});
	}

	const tarballs = readdirSync(tarballDir)
		.filter((name) => name.endsWith(".tgz"))
		.map((name) => join(tarballDir, name));
	if (tarballs.length !== packageDirs.length) {
		throw new Error(`Expected ${packageDirs.length} tarballs, found ${tarballs.length}.`);
	}

	run("npm", ["init", "-y"], { cwd: installDir, capture: true });
	run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", ...tarballs], {
		cwd: installDir,
		capture: true,
	});
	run(process.execPath, [
		"--input-type=module",
		"--eval",
		`await Promise.all(${JSON.stringify(packageNames)}.map((name) => import(name)));`,
	], { cwd: installDir, capture: true });

	const corePackage = JSON.parse(
		readFileSync(join(workspaceRoot, "packages/core/package.json"), "utf8"),
	);
	const cliPath = join(installDir, "node_modules", "@pi-cordis", "core", "dist", "cli.js");
	const output = run(process.execPath, [cliPath, "--version"], { cwd: installDir, capture: true });
	const expected = `picds ${corePackage.version}`;
	if (output !== expected) {
		throw new Error(`Installed CLI returned ${JSON.stringify(output)}; expected ${JSON.stringify(expected)}.`);
	}
	const help = run(process.execPath, [cliPath, "--help"], { cwd: installDir, capture: true });
	if (!help.startsWith("picds - Pi coding agent with a reversible Cordis control plane")) {
		throw new Error("Installed CLI did not return the Pi-Cordis top-level help text.");
	}

	console.log(`Package smoke passed: ${tarballs.length} tarballs installed and imported; ${expected}`);
} finally {
	rmSync(smokeRoot, { recursive: true, force: true });
}
