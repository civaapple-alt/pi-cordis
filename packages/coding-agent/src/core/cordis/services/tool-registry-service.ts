import { Service, type Context } from "@deepseek-ai/cordis";
import type { ToolDefinition } from "../../extensions/types.ts";
import {
	allToolNames,
	createToolDefinition,
	type ToolDef,
	type ToolName,
	type ToolsOptions,
} from "../../tools/index.ts";

export interface ToolRegistryServiceConfig {
	cwd?: string;
	toolsOptions?: ToolsOptions;
}

export class ToolRegistryService extends Service {
	static provide = "tools";
	private customTools: Map<string, ToolDef> = new Map();
	private cwd: string;
	private toolsOptions?: ToolsOptions;

	constructor(ctx: Context, config?: ToolRegistryServiceConfig) {
		super(ctx, "tools");
		this.cwd = config?.cwd ?? process.cwd();
		this.toolsOptions = config?.toolsOptions;
	}

	public register(tool: ToolDef): () => void {
		return this.registerCustomTool(tool);
	}

	public registerCustomTool(tool: ToolDef): () => void {
		this.customTools.set(tool.name, tool);
		return () => {
			this.customTools.delete(tool.name);
		};
	}

	public getBuiltinToolDefinition(toolName: ToolName, cwd: string = this.cwd): ToolDef {
		return createToolDefinition(toolName, cwd, this.toolsOptions);
	}

	public getCustomTools(): ToolDef[] {
		return Array.from(this.customTools.values());
	}

	public getAllToolDefinitions(cwd: string = this.cwd): ToolDef[] {
		const builtin = Array.from(allToolNames).map((name) => this.getBuiltinToolDefinition(name, cwd));
		return [...builtin, ...this.getCustomTools()];
	}

	public getToolNames(cwd: string = this.cwd): string[] {
		return this.getAllToolDefinitions(cwd).map((t) => t.name);
	}
}
