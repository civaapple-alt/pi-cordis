import type { Context } from "@deepseek-ai/cordis";

export interface TodoItem {
	id: string;
	title: string;
	status: "pending" | "in_progress" | "completed" | "cancelled";
	category?: string;
	dependsOn?: string[];
}

export interface TodoTrackerConfig {
	injectToPrompt?: boolean;
	collapseCompletedInPrompt?: boolean;
}

export const name = "todo-tracker";
export const inject = ["tools"];

export function hasCycle(items: TodoItem[], targetId: string, dependencies: string[]): boolean {
	const graph = new Map<string, string[]>();
	for (const item of items) {
		graph.set(item.id, item.dependsOn ?? []);
	}
	graph.set(targetId, dependencies);

	const visited = new Set<string>();
	const stack = new Set<string>();

	function dfs(node: string): boolean {
		if (stack.has(node)) return true;
		if (visited.has(node)) return false;
		visited.add(node);
		stack.add(node);
		for (const neighbor of graph.get(node) ?? []) {
			if (dfs(neighbor)) return true;
		}
		stack.delete(node);
		return false;
	}

	return dfs(targetId);
}

export function apply(ctx: Context, config: TodoTrackerConfig = {}) {
	const todos: TodoItem[] = [];
	const injectToPrompt = config.injectToPrompt ?? true;
	const collapseCompleted = config.collapseCompletedInPrompt ?? true;

	// 1. Register todo_write tool in Cordis tool registry
	const unregisterWrite = ctx.tools.register({
		name: "todo_write",
		description: "Add, update, or remove tasks in the session todo list with dependency cycle validation.",
		parameters: {
			type: "object",
			properties: {
				action: {
					type: "string",
					enum: ["add", "update", "clear"],
					description: "Action to perform on the todo list",
				},
				id: { type: "string", description: "Task ID (required for update)" },
				title: { type: "string", description: "Task description" },
				status: {
					type: "string",
					enum: ["pending", "in_progress", "completed", "cancelled"],
					description: "Task status",
				},
				category: { type: "string", description: "Optional grouping category" },
				dependsOn: {
					type: "array",
					items: { type: "string" },
					description: "Optional task IDs this task depends on (blocked by)",
				},
			},
			required: ["action"],
		},
		renderCall: (args: { action: string; title?: string; status?: string; id?: string }, theme?: any) => {
			const actionTag = args.action.toUpperCase();
			const desc = args.title ? `"${args.title}"` : args.id ? `#${args.id}` : "";
			if (!theme?.fg) return `📝 todo_write [${actionTag}] ${desc}`;
			return `${theme.fg("accent", theme.bold("📝 todo_write "))}${theme.fg("dim", `[${actionTag}]`)} ${theme.fg("foreground", desc)}`;
		},
		renderResult: (result: any, options?: any, theme?: any) => {
			const activeCount = todos.filter((t) => t.status === "pending" || t.status === "in_progress").length;
			const doneCount = todos.filter((t) => t.status === "completed").length;
			const msg = result?.message ?? `Todos: ${todos.length}`;
			if (!theme?.fg) return `${msg} (${activeCount} active, ${doneCount} done)`;
			return `${theme.fg("success", msg)} ${theme.fg("dim", `(${activeCount} active, ${doneCount} done)`)}`;
		},
		execute: async (args: {
			action: string;
			id?: string;
			title?: string;
			status?: TodoItem["status"];
			category?: string;
			dependsOn?: string[];
		}) => {
			if (args.action === "add" && args.title) {
				const id = args.id ?? `todo_${todos.length + 1}`;
				const deps = args.dependsOn ?? [];
				if (todos.some((todo) => todo.id === id)) {
					return { error: `Task ID "${id}" already exists` };
				}

				// Check self-dependency
				if (deps.includes(id)) {
					return { error: `Task "${id}" cannot depend on itself` };
				}

				// Check cyclic dependency
				if (deps.length > 0 && hasCycle(todos, id, deps)) {
					return { error: `Cyclic dependency detected for task "${id}"` };
				}

				const item: TodoItem = {
					id,
					title: args.title,
					status: args.status ?? "pending",
					category: args.category,
					dependsOn: deps.length > 0 ? deps : undefined,
				};
				todos.push(item);
				return { message: `Added task "${args.title}" [${id}]`, item };
			}

			if (args.action === "update" && args.id) {
				const item = todos.find((t) => t.id === args.id);
				if (item) {
					if (args.dependsOn !== undefined) {
						if (args.dependsOn.includes(item.id)) {
							return { error: `Task "${item.id}" cannot depend on itself` };
						}
						if (hasCycle(todos, item.id, args.dependsOn)) {
							return { error: `Cyclic dependency detected for task "${item.id}"` };
						}
						item.dependsOn = args.dependsOn;
					}
					if (args.title) item.title = args.title;
					if (args.status === "in_progress" || args.status === "completed") {
						const incompleteDependencies = (item.dependsOn ?? []).filter((dependencyId) => {
							const dependency = todos.find((todo) => todo.id === dependencyId);
							return !dependency || dependency.status !== "completed";
						});
						if (incompleteDependencies.length > 0) {
							return { error: `Task "${item.id}" is blocked by incomplete dependencies: ${incompleteDependencies.join(", ")}` };
						}
					}
					if (args.status) item.status = args.status;
					if (args.category) item.category = args.category;
					return { message: `Updated task ${args.id} -> ${item.status}`, item };
				}
				return { error: `Task ${args.id} not found` };
			}

			if (args.action === "clear") {
				const clearedCount = todos.length;
				todos.length = 0;
				return { message: `Todo list cleared (${clearedCount} tasks removed)` };
			}

			return { total: todos.length, todos: [...todos] };
		},
	});

	// 2. Register todo_read tool
	const unregisterRead = ctx.tools.register({
		name: "todo_read",
		description: "Read the current list of tasks in the session todo list.",
		parameters: { type: "object", properties: {} },
		execute: async () => ({
			total: todos.length,
			active: todos.filter((t) => t.status === "pending" || t.status === "in_progress").length,
			completed: todos.filter((t) => t.status === "completed").length,
			todos: [...todos],
		}),
	});

	// 3. Adaptive Prompt Injection (collapses completed tasks to preserve token budget)
	let removePromptHook: (() => void) | undefined;
	if (injectToPrompt) {
		removePromptHook = ctx.on("pi/prompt-transform" as any, async (event: { prompt: string }) => {
			const activeTodos = todos.filter((t) => t.status === "pending" || t.status === "in_progress");
			const completedTodos = todos.filter((t) => t.status === "completed");
			const cancelledTodos = todos.filter((t) => t.status === "cancelled");

			if (todos.length === 0) return;

			let promptBlock = "\n\n## 📝 Current Task Checklist:\n";
			if (activeTodos.length > 0) {
				promptBlock += activeTodos
					.map((t) => {
						const icon = t.status === "in_progress" ? "▶" : " ";
						const cat = t.category ? `[${t.category}] ` : "";
						const dep = t.dependsOn && t.dependsOn.length > 0 ? ` (blocked by: ${t.dependsOn.join(", ")})` : "";
						return `- [${icon}] ${cat}${t.title} (${t.id})${dep}`;
					})
					.join("\n") + "\n";
			}

			if (collapseCompleted) {
				const hiddenParts: string[] = [];
				if (completedTodos.length > 0) hiddenParts.push(`✓ ${completedTodos.length} completed`);
				if (cancelledTodos.length > 0) hiddenParts.push(`✗ ${cancelledTodos.length} cancelled`);
				if (hiddenParts.length > 0) {
					promptBlock += `(${hiddenParts.join(", ")} hidden)\n`;
				}
			} else {
				if (completedTodos.length > 0) {
					promptBlock += completedTodos.map((t) => `- [x] ${t.title} (${t.id})`).join("\n") + "\n";
				}
			}

			event.prompt += promptBlock;
		});
	}

	return () => {
		unregisterWrite();
		unregisterRead();
		removePromptHook?.();
	};
}

export default { name, inject, apply };
