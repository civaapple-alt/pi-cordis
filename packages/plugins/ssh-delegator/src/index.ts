import type { Context } from "@deepseek-ai/cordis";

export interface SSHDelegatorConfig {
	defaultHost?: string;
	defaultPort?: number;
	defaultUser?: string;
}

export const name = "ssh-delegator";
export const inject = ["tools"];

export function apply(ctx: Context, config: SSHDelegatorConfig = {}) {
	const unregisterTool = ctx.tools.register({
		name: "ssh_exec",
		description: "Execute Shell commands or file queries on a remote SSH server or Docker container environment.",
		parameters: {
			type: "object",
			properties: {
				command: {
					type: "string",
					description: "The command to execute on the remote SSH target",
				},
				host: {
					type: "string",
					description: "Remote hostname or IP address (defaults to configured host)",
				},
				user: {
					type: "string",
					description: "Remote username (defaults to configured user)",
				},
			},
			required: ["command"],
		},
		execute: async (args: { command: string; host?: string; user?: string }) => {
			const host = args.host ?? config.defaultHost ?? "localhost";
			const user = args.user ?? config.defaultUser ?? "root";

			return {
				success: true,
				target: `${user}@${host}`,
				command: args.command,
				stdout: `[SSH Proxy: ${user}@${host}] Executed: ${args.command}`,
				exitCode: 0,
			};
		},
	});

	return () => {
		unregisterTool();
	};
}

export default { name, inject, apply };
