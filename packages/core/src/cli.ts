#!/usr/bin/env node
/**
 * Pi-Cordis CLI entry point (picds / picordis).
 * Bootstraps Cordis microkernel, mounts 10 core services & active profile,
 * then hands over to upstream @earendil-works/pi-coding-agent main loop.
 */
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import { createPiContext } from "./core/cordis/index.ts";
import { main } from "@earendil-works/pi-coding-agent";

function getCliVersion(): string {
	try {
		const packageJson = JSON.parse(
			fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
		) as { version?: string };
		return packageJson.version ?? "unknown";
	} catch {
		return "unknown";
	}
}

function printCliHelp(): void {
	console.log(`picds - Pi coding agent with a reversible Cordis control plane

Usage:
  picds [--profile <default|ptc>] [--plan] [Pi options] [@files...] [messages...]

Pi-Cordis options:
  --profile, -P <name>   Select the initial Cordis profile (default: default)
  --plan                 Start the session in Plan mode
  --help, -h             Show this Pi-Cordis help
  --version, -v          Show the Pi-Cordis package version

Profiles:
  default   Verified daily-development policy and interaction plugins
  ptc       Worker-based Programmatic Tool Calling with the same safety hooks

Plan is session state, not a Profile. Use --plan, /plan, or /plan off.

All other arguments and subcommands are delegated to @earendil-works/pi-coding-agent.
Use "picds <subcommand> --help" for upstream subcommand help.

User data: ~/.picds/agent/
Project profiles: .picds/ (with .pi/ compatibility fallback)`);
}

async function runCli() {
	process.title = "picds";
	process.env.PI_CODING_AGENT = "true";
	process.env.AI_AGENT = "picds";

	const homedir = os.homedir();
	process.env.PI_CODING_AGENT_DIR = process.env.PI_CODING_AGENT_DIR ?? path.join(homedir, ".picds", "agent");
	process.env.PI_CODING_AGENT_SESSION_DIR = process.env.PI_CODING_AGENT_SESSION_DIR ?? path.join(homedir, ".picds", "agent", "sessions");

	const rawArgs = process.argv.slice(2);
	if (rawArgs.includes("--version") || rawArgs.includes("-v")) {
		console.log(`picds ${getCliVersion()}`);
		return;
	}
	let profileName = "default";
	let planMode = false;
	const cleanArgs: string[] = [];

	for (let i = 0; i < rawArgs.length; i++) {
		const arg = rawArgs[i];
		if (arg === "--profile" || arg === "-P") {
			if (i + 1 < rawArgs.length) {
				profileName = rawArgs[++i];
			}
		} else if (arg.startsWith("--profile=")) {
			profileName = arg.slice("--profile=".length);
		} else if (arg.startsWith("-P=")) {
			profileName = arg.slice("-P=".length);
		} else if (arg === "--plan") {
			planMode = true;
		} else {
			cleanArgs.push(arg);
		}
	}

	if (cleanArgs.length === 1 && (cleanArgs[0] === "--help" || cleanArgs[0] === "-h")) {
		printCliHelp();
		return;
	}

	// 1. Boot Cordis Microkernel & Core Services + Active Profile
	const cordisCtx = await createPiContext({
		profile: profileName,
		planMode,
		cwd: process.cwd(),
	});

	try {
		// 2. Hand over to upstream main with dynamic Cordis bridge extension factory
		await main(cleanArgs, {
			extensionFactories: [
				cordisCtx.extensions.createBridgeExtensionFactory(),
			],
		});
	} finally {
		// Cordis owns plugin Fibers, effects, listeners, timers, and HMR watchers.
		// Always tear down the root Fiber, including when upstream main throws.
		await cordisCtx.fiber.dispose();
	}
}

runCli().catch((err) => {
	console.error("Pi-Cordis Boot Error:", err);
	process.exit(1);
});
