import type { Context } from "@deepseek-ai/cordis";

export interface ToolsManagerConfig {
	allowRuntimeToggle?: boolean;
}

export const name = "tools-manager";
export const inject = ["tools"];

export function apply(ctx: Context, config: ToolsManagerConfig = {}) {
	const disabledTools = new Set<string>();

	// 1. Register list_tools tool
	const unregisterTool = ctx.tools.register({
		name: "manage_tools",
		description: "List active tools or dynamically enable/disable specific tools to keep context focused.",
		parameters: {
			type: "object",
			properties: {
				action: {
					type: "string",
					enum: ["list", "disable", "enable"],
					description: "Action to perform on tool registry",
				},
				toolName: {
					type: "string",
					description: "Target tool name to enable or disable",
				},
			},
			required: ["action"],
		},
		execute: async (args: { action: "list" | "disable" | "enable"; toolName?: string }) => {
			const allToolNames = ctx.tools.getToolNames();

			if (args.action === "disable" && args.toolName) {
				if (!allToolNames.includes(args.toolName)) {
					return { error: `Tool "${args.toolName}" does not exist.` };
				}
				disabledTools.add(args.toolName);
				return { message: `Tool "${args.toolName}" disabled for this session.` };
			}

			if (args.action === "enable" && args.toolName) {
				disabledTools.delete(args.toolName);
				return { message: `Tool "${args.toolName}" re-enabled.` };
			}

			return {
				total: allToolNames.length,
				active: allToolNames.filter((t: string) => !disabledTools.has(t)),
				disabled: Array.from(disabledTools),
			};
		},
	});

	// Reversible disposal
	return () => {
		unregisterTool();
		disabledTools.clear();
	};
}

export default { name, inject, apply };
