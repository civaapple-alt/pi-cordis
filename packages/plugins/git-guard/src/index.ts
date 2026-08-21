import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import type { Context } from "@deepseek-ai/cordis";

const execFileAsync = promisify(execFile);

export interface GitGuardConfig {
	autoCheckpoint?: boolean;
}

export interface GitCheckpointInfo {
	id: string;
	sha: string;
	timestamp: number;
	description?: string;
}

interface GitCheckpointExecutionContext {
	signal?: AbortSignal;
	ctx?: {
		hasUI?: boolean;
		ui?: { select?: (title: string, options: string[], config?: { signal?: AbortSignal }) => Promise<string | undefined> };
	};
}

export const name = "git-guard";
export const inject = ["settings", "tools"];

export function apply(ctx: Context, config: GitGuardConfig = {}) {
	const autoCheckpoint = config.autoCheckpoint ?? false;
	const checkpoints = new Map<string, GitCheckpointInfo>();

	const getCwd = () => (ctx as any).settings?.getCwd?.() ?? process.cwd();

	// 1. Optionally create a lightweight stash checkpoint before session turns.
	let removeBeforeHook: (() => void) | undefined;
	if (autoCheckpoint) {
		removeBeforeHook = ctx.on("pi/session-before" as any, async (event: any) => {
			try {
				const { stdout } = await execFileAsync("git", ["stash", "create"], { cwd: getCwd() });
				const sha = stdout.trim();
				if (sha) {
					const id = `cp_${randomUUID()}`;
					checkpoints.set(id, { id, sha, timestamp: Date.now(), description: event?.title ?? "Auto checkpoint" });
				}
			} catch {
				// Non-git directory or nothing to stash
			}
		});
	}

	// 2. Register git_checkpoint tool
	const unregisterTool = (ctx as any).tools?.register?.({
		name: "git_checkpoint",
		description: "Create, list, or apply process-local references to tracked-file git stash snapshots.",
		sideEffect: (args: { action?: string }) => args.action === "restore" ? "workspace" : "none",
		parameters: {
			type: "object",
			properties: {
				action: {
					type: "string",
					enum: ["create", "restore", "list"],
					description: "Checkpoint action to execute.",
				},
				checkpointId: {
					type: "string",
					description: "Target checkpoint ID for restore action.",
				},
				description: {
					type: "string",
					description: "Optional description when creating a checkpoint.",
				},
			},
			required: ["action"],
		},
		execute: async (
			args: { action: "create" | "restore" | "list"; checkpointId?: string; description?: string },
			executionContext?: GitCheckpointExecutionContext,
		) => {
			const cwd = getCwd();

			if (args.action === "create") {
				try {
					const { stdout } = await execFileAsync("git", ["stash", "create"], { cwd });
					const sha = stdout.trim();
					if (!sha) {
						return { success: true, message: "Working tree is clean; no checkpoint needed." };
					}
					const id = `cp_${randomUUID()}`;
					const info: GitCheckpointInfo = { id, sha, timestamp: Date.now(), description: args.description };
					checkpoints.set(id, info);
					return { success: true, message: `Created checkpoint "${id}" (${sha.slice(0, 7)})`, checkpoint: info };
				} catch (err: any) {
					return { success: false, error: `Failed to create git checkpoint: ${err?.message || String(err)}` };
				}
			}

			if (args.action === "restore") {
				if (!args.checkpointId) {
					return { success: false, error: "checkpointId is required for restore action." };
				}
				const cp = checkpoints.get(args.checkpointId);
				if (!cp) {
					return { success: false, error: `Checkpoint "${args.checkpointId}" not found.` };
				}
				const ui = executionContext?.ctx?.ui;
				if (!executionContext?.ctx?.hasUI || !ui?.select) {
					return {
						success: false,
						error: "Interactive confirmation is required before applying a checkpoint to the working tree.",
					};
				}
				const choice = await ui.select(
					`Apply checkpoint "${cp.id}" (${cp.sha.slice(0, 7)}) to the current working tree? This can conflict with current changes.`,
					["Apply checkpoint", "Cancel"],
					{ signal: executionContext.signal },
				);
				if (choice !== "Apply checkpoint") {
					return { success: false, error: "Checkpoint restore cancelled; the working tree was not changed." };
				}
				try {
					await execFileAsync("git", ["stash", "apply", cp.sha], { cwd });
					return { success: true, message: `Applied checkpoint "${args.checkpointId}" to the current working tree.` };
				} catch (err: any) {
					return { success: false, error: `Failed to restore checkpoint: ${err?.message || String(err)}` };
				}
			}

			if (args.action === "list") {
				return {
					total: checkpoints.size,
					checkpoints: Array.from(checkpoints.values()),
				};
			}

			return { success: false, error: `Unknown action: ${(args as any).action}` };
		},
	});

	return () => {
		removeBeforeHook?.();
		unregisterTool?.();
	};
}

export default { name, inject, apply };
