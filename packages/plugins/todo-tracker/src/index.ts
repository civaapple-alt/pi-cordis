import type { Context } from "@deepseek-ai/cordis";

export interface TodoItem {
	id: string;
	title: string;
	status: "pending" | "in_progress" | "completed";
}

export interface TodoTrackerConfig {
	injectToPrompt?: boolean;
}

export const name = "todo-tracker";
export const inject = ["tools"];

export function apply(ctx: Context, config: TodoTrackerConfig = {}) {
	const todos: TodoItem[] = [];
	const injectToPrompt = config.injectToPrompt ?? true;

	// Register todo_write tool in Cordis tool registry
	ctx.tools.register({
		name: "todo_write",
		description: "Add, update, or remove tasks in the session todo list.",
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
					enum: ["pending", "in_progress", "completed"],
					description: "Task status",
				},
			},
			required: ["action"],
		},
		execute: async (args: { action: string; id?: string; title?: string; status?: TodoItem["status"] }) => {
			if (args.action === "add" && args.title) {
				const id = args.id ?? `todo_${todos.length + 1}`;
				todos.push({ id, title: args.title, status: args.status ?? "pending" });
				return { message: `Added task "${args.title}" [${id}]` };
			}

			if (args.action === "update" && args.id) {
				const item = todos.find((t) => t.id === args.id);
				if (item) {
					if (args.title) item.title = args.title;
					if (args.status) item.status = args.status;
					return { message: `Updated task ${args.id}: ${item.status}` };
				}
				return { error: `Task ${args.id} not found` };
			}

			if (args.action === "clear") {
				todos.length = 0;
				return { message: "Todo list cleared" };
			}

			return { todos: [...todos] };
		},
	});

	// Register todo_read tool
	ctx.tools.register({
		name: "todo_read",
		description: "Read the current list of tasks in the session todo list.",
		parameters: { type: "object", properties: {} },
		execute: async () => ({
			total: todos.length,
			todos: [...todos],
		}),
	});

	// Inject active todos into prompt
	if (injectToPrompt) {
		ctx.on("pi/prompt-transform", async (event: { prompt: string }) => {
			const activeTodos = todos.filter((t) => t.status !== "completed");
			if (activeTodos.length === 0) return;

			const todoListStr = activeTodos
				.map((t) => `- [${t.status === "in_progress" ? "▶" : " "}] ${t.title} (${t.id})`)
				.join("\n");

			event.prompt += `\n\n## Current Active Tasks:\n${todoListStr}\n`;
		});
	}
}

export default { name, inject, apply };
