import { Service, type Context } from "@deepseek-ai/cordis";
import type { ToolDefinition } from "../../extensions/types.ts";
import {
	allToolNames,
	createToolDefinition,
	type ToolDef,
	type ToolName,
	type ToolsOptions,
} from "../../tools/index.ts";

export interface CordisPluginToolDef {
	name: string;
	description: string;
	parameters?: any;
	execute: (args: any, ...rest: any[]) => Promise<any>;
}

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

	public register(tool: ToolDef | CordisPluginToolDef | any): () => void {
		return this.registerCustomTool(tool);
	}

	public registerCustomTool(tool: ToolDef | CordisPluginToolDef | any): () => void {
		return this.ctx.effect(() => {
			this.customTools.set(tool.name, tool as ToolDef);
			return () => {
				this.customTools.delete(tool.name);
			};
		});
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

	public get(toolName: string, cwd: string = this.cwd): ToolDef | undefined {
		if (this.customTools.has(toolName)) {
			return this.customTools.get(toolName);
		}
		if (allToolNames.has(toolName as ToolName)) {
			return this.getBuiltinToolDefinition(toolName as ToolName, cwd);
		}
		return undefined;
	}

	public has(toolName: string): boolean {
		return this.customTools.has(toolName) || allToolNames.has(toolName as ToolName);
	}
}
