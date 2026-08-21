import type { Context } from "@deepseek-ai/cordis";

export interface ToolsManagerConfig {
	allowRuntimeToggle?: boolean;
}

export const name = "tools-manager";
export const inject = ["tools"];

export function apply(ctx: Context, config: ToolsManagerConfig = {}) {
	const disabledTools = new Set<string>();
	const allowRuntimeToggle = config.allowRuntimeToggle ?? true;
	const removeFilter = ctx.tools.addFilter((tool) => (
		tool.name === "manage_tools" || !disabledTools.has(tool.name)
	));

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
		renderCall: (args: { action: string; toolName?: string }) => (
			`manage_tools ${args.action}${args.toolName ? ` ${args.toolName}` : ""}`
		),
		renderResult: (result: any) => result?.error
			? `✗ ${result.error}`
			: result?.message ?? `Active tools: ${(result?.active ?? []).join(", ") || "none"}`,
		execute: async (args: { action: "list" | "disable" | "enable"; toolName?: string }) => {
			const allToolNames = ctx.tools.getToolNames();

			if (args.action === "disable" && args.toolName) {
				if (!allowRuntimeToggle) {
					return { error: "Runtime tool toggling is disabled by profile policy." };
				}
				if (!allToolNames.includes(args.toolName)) {
					return { error: `Tool "${args.toolName}" does not exist.` };
				}
				if (args.toolName === "manage_tools") {
					return { error: "manage_tools cannot disable itself." };
				}
				disabledTools.add(args.toolName);
				ctx.emit("pi/tools-changed");
				return { message: `Tool "${args.toolName}" disabled for this session.` };
			}
			if (args.action === "disable") return { error: "toolName is required for disable action." };

			if (args.action === "enable" && args.toolName) {
				if (!allowRuntimeToggle) {
					return { error: "Runtime tool toggling is disabled by profile policy." };
				}
				if (!allToolNames.includes(args.toolName)) {
					return { error: `Tool "${args.toolName}" does not exist.` };
				}
				disabledTools.delete(args.toolName);
				ctx.emit("pi/tools-changed");
				return { message: `Tool "${args.toolName}" re-enabled.` };
			}
			if (args.action === "enable") return { error: "toolName is required for enable action." };

			if (args.action === "list") return {
				total: allToolNames.length,
				active: ctx.tools.getExportedToolNames(),
				disabled: Array.from(disabledTools),
			};
			return { error: `Unknown manage_tools action: ${(args as any).action}` };
		},
	});

	// Reversible disposal
	return () => {
		unregisterTool();
		removeFilter();
		disabledTools.clear();
	};
}

export default { name, inject, apply };
