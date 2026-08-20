#!/usr/bin/env node
/**
 * Pi-Cordis CLI entry point (picds / picordis).
 * Bootstraps Cordis microkernel, mounts 10 core services & active profile,
 * then hands over to upstream @earendil-works/pi-coding-agent main loop.
 */
import * as os from "node:os";
import * as path from "node:path";
import { createPiContext } from "./core/cordis/index.ts";
import { main } from "@earendil-works/pi-coding-agent";

async function runCli() {
	process.title = "picds";
	process.env.PI_CODING_AGENT = "true";
	process.env.AI_AGENT = "picds";
	process.emitWarning = (() => {}) as typeof process.emitWarning;

	const homedir = os.homedir();
	process.env.PI_CODING_AGENT_DIR = process.env.PI_CODING_AGENT_DIR ?? path.join(homedir, ".picds", "agent");
	process.env.PI_CODING_AGENT_SESSION_DIR = process.env.PI_CODING_AGENT_SESSION_DIR ?? path.join(homedir, ".picds", "agent", "sessions");

	const rawArgs = process.argv.slice(2);
	let profileName = "default";
	const profileIdx = rawArgs.indexOf("--profile");
	if (profileIdx !== -1 && rawArgs[profileIdx + 1]) {
		profileName = rawArgs[profileIdx + 1];
		rawArgs.splice(profileIdx, 2);
	}

	// 1. Boot Cordis Microkernel & Core Services + Active Profile
	const cordisCtx = await createPiContext({
		profile: profileName,
		cwd: process.cwd(),
	});

	// 2. Hand over to upstream main with dynamic Cordis bridge extension factory
	await main(rawArgs, {
		extensionFactories: [
			cordisCtx.extensions.createBridgeExtensionFactory(),
		],
	});
}

runCli().catch((err) => {
	console.error("Pi-Cordis Boot Error:", err);
	process.exit(1);
});
