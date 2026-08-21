import { Service, type Context } from "@deepseek-ai/cordis";
import {
	createReadToolDefinition,
	createEditToolDefinition,
	createWriteToolDefinition,
	createBashToolDefinition,
	createGrepToolDefinition,
	createFindToolDefinition,
	createLsToolDefinition,
} from "@earendil-works/pi-coding-agent";

export type ToolName = "read" | "edit" | "write" | "bash" | "grep" | "find" | "ls";

export const allToolNames: ReadonlySet<ToolName> = new Set([
	"read",
	"edit",
	"write",
	"bash",
	"grep",
	"find",
	"ls",
]);

export interface ToolDef {
	name: string;
	description: string;
	parameters?: any;
	execute: (args: any, ...rest: any[]) => Promise<any>;
	renderCall?: (args: any, theme?: any) => any;
	renderResult?: (result: any, options?: any, theme?: any) => any;
	[key: string]: any;
}

export interface CordisPluginToolDef {
	name: string;
	description: string;
	parameters?: any;
	execute: (args: any, ...rest: any[]) => Promise<any>;
	renderCall?: (args: any, theme?: any) => any;
	renderResult?: (result: any, options?: any, theme?: any) => any;
}

export type ToolFilterFn = (tool: ToolDef) => boolean;

export interface ToolRegistryServiceConfig {
	cwd?: string;
	toolsOptions?: any;
}

export function createToolDefinition(toolName: ToolName, cwd: string, options?: any): ToolDef {
	switch (toolName) {
		case "read":
			return createReadToolDefinition(cwd, options) as ToolDef;
		case "edit":
			return createEditToolDefinition(cwd, options) as ToolDef;
		case "write":
			return createWriteToolDefinition(cwd, options) as ToolDef;
		case "bash":
			return createBashToolDefinition(cwd, options) as ToolDef;
		case "grep":
			return createGrepToolDefinition(cwd, options) as ToolDef;
		case "find":
			return createFindToolDefinition(cwd, options) as ToolDef;
		case "ls":
			return createLsToolDefinition(cwd, options) as ToolDef;
		default:
			throw new Error(`Unknown built-in tool: ${toolName}`);
	}
}

export class ToolRegistryService extends Service {
	static provide = "tools";
	private customTools: Map<string, ToolDef[]> = new Map();
	private filters: Set<ToolFilterFn> = new Set();
	private cwd: string;
	private toolsOptions?: any;

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
			const definition = tool as ToolDef;
			const registrations = this.customTools.get(tool.name) ?? [];
			registrations.push(definition);
			this.customTools.set(tool.name, registrations);
			this.ctx.emit("pi/tool-registered", tool as ToolDef);
			this.ctx.emit("pi/tools-changed");
			return () => {
				const activeRegistrations = this.customTools.get(tool.name);
				if (activeRegistrations) {
					const index = activeRegistrations.lastIndexOf(definition);
					if (index >= 0) activeRegistrations.splice(index, 1);
					if (activeRegistrations.length === 0) this.customTools.delete(tool.name);
				}
				this.ctx.emit("pi/tool-unregistered", tool.name);
				this.ctx.emit("pi/tools-changed");
			};
		});
	}

	/**
	 * Register a tool filter (e.g. for Code Mode or safe masking)
	 * Filter is automatically removed when the registering plugin fiber is disposed.
	 */
	public addFilter(filter: ToolFilterFn): () => void {
		return this.ctx.effect(() => {
			this.filters.add(filter);
			this.ctx.emit("pi/tools-changed");
			return () => {
				this.filters.delete(filter);
				this.ctx.emit("pi/tools-changed");
			};
		});
	}

	public getBuiltinToolDefinition(toolName: ToolName, cwd: string = this.cwd): ToolDef {
		return createToolDefinition(toolName, cwd, this.toolsOptions);
	}

	public getCustomTools(): ToolDef[] {
		return Array.from(this.customTools.values(), (registrations) => registrations.at(-1)!)
			.filter(Boolean);
	}

	public getAllToolDefinitions(cwd: string = this.cwd): ToolDef[] {
		const builtin = Array.from(allToolNames).map((name) => this.getBuiltinToolDefinition(name, cwd));
		return [...builtin, ...this.getCustomTools()];
	}

	public getToolNames(cwd: string = this.cwd): string[] {
		return this.getAllToolDefinitions(cwd).map((t) => t.name);
	}

	/**
	 * Get exported tool definitions visible to the LLM model (applying active filters)
	 */
	public getExportedToolDefinitions(cwd: string = this.cwd): ToolDef[] {
		const all = this.getAllToolDefinitions(cwd);
		if (this.filters.size === 0) return all;

		return all.filter((tool) => {
			for (const filter of this.filters) {
				if (!filter(tool)) return false;
			}
			return true;
		});
	}

	/**
	 * Get list of tool names exported to the LLM model
	 */
	public getExportedToolNames(cwd: string = this.cwd): string[] {
		return this.getExportedToolDefinitions(cwd).map((t) => t.name);
	}

	/**
	 * Check if a tool is exported to the LLM model
	 */
	public isExported(toolName: string, cwd: string = this.cwd): boolean {
		return this.getExportedToolNames(cwd).includes(toolName);
	}

	public get(toolName: string, cwd: string = this.cwd): ToolDef | undefined {
		if (this.customTools.has(toolName)) {
			return this.customTools.get(toolName)?.at(-1);
		}
		if (allToolNames.has(toolName as ToolName)) {
			return this.getBuiltinToolDefinition(toolName as ToolName, cwd);
		}
		return undefined;
	}

	public has(toolName: string): boolean {
		return this.customTools.has(toolName) || allToolNames.has(toolName as ToolName);
	}

	/**
	 * Execute a tool with pre/post Cordis lifecycle hooks and event emissions
	 */
	public async executeTool(toolName: string, args: Record<string, unknown>, ...rest: any[]): Promise<any> {
		const tool = this.get(toolName);
		if (!tool) {
			throw new Error(`Tool "${toolName}" not found in registry.`);
		}

		// 1. Pre-execution hook
		const executionContext = rest[0]?.ctx;
		const sessionId = executionContext?.sessionManager?.getSessionId?.();
		await this.ctx.serial("pi/tool-call", { toolName, name: toolName, args, sessionId });

		// 2. Execution
		const resultEvent = {
			toolName,
			name: toolName,
			args,
			result: await tool.execute(args, ...rest),
		};

		// 3. Post-execution hook
		await this.ctx.serial("pi/tool-result", resultEvent);

		return resultEvent.result;
	}
}

export default ToolRegistryService;
