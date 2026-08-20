import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Context } from "@deepseek-ai/cordis";

const execFileAsync = promisify(execFile);

export interface GitGuardConfig {
	autoCheckpoint?: boolean;
	warnDirtyOnStart?: boolean;
}

export interface GitCheckpointInfo {
	id: string;
	sha: string;
	timestamp: number;
	description?: string;
}

export const name = "git-guard";
export const inject = ["settings", "tools"];

export function apply(ctx: Context, config: GitGuardConfig = {}) {
	const autoCheckpoint = config.autoCheckpoint ?? true;
	const checkpoints = new Map<string, GitCheckpointInfo>();

	const getCwd = () => (ctx as any).settings?.getCwd?.() ?? process.cwd();

	// 1. Check if git working tree is dirty on session start
	const removeStartHook = ctx.on("pi/session-start" as any, async () => {
		try {
			const { stdout } = await execFileAsync("git", ["status", "--porcelain"], { cwd: getCwd() });
			if (stdout.trim().length > 0 && config.warnDirtyOnStart) {
				const dirtyFiles = stdout.trim().split("\n").length;
				// Emits warning or logs for status
			}
		} catch {
			// Not a git repository or git unavailable
		}
	});

	// 2. Auto-create lightweight stash checkpoint before session turns
	let removeBeforeHook: (() => void) | undefined;
	if (autoCheckpoint) {
		removeBeforeHook = ctx.on("pi/session-before" as any, async (event: any) => {
			try {
				const { stdout } = await execFileAsync("git", ["stash", "create"], { cwd: getCwd() });
				const sha = stdout.trim();
				if (sha) {
					const id = `cp_${Date.now()}`;
					checkpoints.set(id, { id, sha, timestamp: Date.now(), description: event?.title ?? "Auto checkpoint" });
				}
			} catch {
				// Non-git directory or nothing to stash
			}
		});
	}

	// 3. Register git_checkpoint tool
	const unregisterTool = (ctx as any).tools?.register?.({
		name: "git_checkpoint",
		description: "Manage lightweight git stash snapshots to enable safe rollback if modifications fail.",
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
		execute: async (args: { action: "create" | "restore" | "list"; checkpointId?: string; description?: string }) => {
			const cwd = getCwd();

			if (args.action === "create") {
				try {
					const { stdout } = await execFileAsync("git", ["stash", "create"], { cwd });
					const sha = stdout.trim();
					if (!sha) {
						return { success: true, message: "Working tree is clean; no checkpoint needed." };
					}
					const id = `cp_${Date.now()}`;
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
				try {
					await execFileAsync("git", ["stash", "apply", cp.sha], { cwd });
					return { success: true, message: `Successfully restored state from checkpoint "${args.checkpointId}"` };
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
		removeStartHook();
		removeBeforeHook?.();
		unregisterTool?.();
	};
}

export default { name, inject, apply };
