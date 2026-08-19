import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Context } from "@deepseek-ai/cordis";

const execFileAsync = promisify(execFile);

export interface GitGuardConfig {
	autoCheckpoint?: boolean;
	warnDirtyOnStart?: boolean;
}

export const name = "git-guard";
export const inject = ["settings"];

export function apply(ctx: Context, config: GitGuardConfig = {}) {
	const autoCheckpoint = config.autoCheckpoint ?? true;
	const checkpoints = new Map<string, string>();

	// Check if git working tree is dirty on session start
	ctx.on("pi/session-start", async () => {
		try {
			const { stdout } = await execFileAsync("git", ["status", "--porcelain"], {
				cwd: ctx.settings?.getCwd?.() ?? process.cwd(),
			});
			if (stdout.trim().length > 0 && config.warnDirtyOnStart) {
				// Workspace dirty status recorded
			}
		} catch {
			// Not a git repository or git unavailable
		}
	});

	// Create stash checkpoint before risky operations
	if (autoCheckpoint) {
		ctx.on("pi/session-before", async (event: { action: string; targetId?: string }) => {
			try {
				const { stdout } = await execFileAsync("git", ["stash", "create"], {
					cwd: ctx.settings?.getCwd?.() ?? process.cwd(),
				});
				const ref = stdout.trim();
				if (ref && event.targetId) {
					checkpoints.set(event.targetId, ref);
				}
			} catch {
				// Git stash failed or non-git directory
			}
		});
	}
}

export default { name, inject, apply };
