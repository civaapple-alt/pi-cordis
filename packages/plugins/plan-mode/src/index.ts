import type { Context } from "@deepseek-ai/cordis";

export interface PlanModeConfig {
	initialActive?: boolean;
	blockMutations?: boolean;
	injectGuidelines?: boolean;
}

export interface PlanModeState {
	active: boolean;
	lastApprovedPlan?: string;
}

interface PiExecutionContext {
	hasUI?: boolean;
	isIdle?: () => boolean;
	sessionManager?: { getSessionId?: () => string };
	ui?: {
		editor?: (title: string, prefill?: string) => Promise<string | undefined>;
		input?: (title: string, placeholder?: string, options?: { signal?: AbortSignal }) => Promise<string | undefined>;
		notify?: (message: string, level?: string) => void;
		select?: (title: string, options: string[], config?: { signal?: AbortSignal }) => Promise<string | undefined>;
	};
}

interface ToolExecutionContext {
	ctx?: PiExecutionContext;
	signal?: AbortSignal;
}

interface PlanToolResult {
	content: Array<{ type: "text"; text: string }>;
	details: {
		active: boolean;
		approved: boolean;
		feedback?: string;
		plan?: string;
		sessionId: string;
	};
	isError?: boolean;
}

const DEFAULT_SESSION_ID = "default";
const MUTATING_TOOLS = new Set(["write", "edit", "patch", "apply_patch"]);

const DESTRUCTIVE_COMMAND_PATTERNS = [
	/\b(?:rm|rmdir|mv|cp|mkdir|touch|chmod|chown|chgrp|ln|tee|truncate|dd|shred)\b/i,
	/(^|[^<])>(?!>)/,
	/>>/,
	/\b(?:npm|pnpm|yarn)\s+(?:add|install|remove|uninstall|update|ci|link|publish)\b/i,
	/\bpip\s+(?:install|uninstall)\b/i,
	/\bgit\s+(?:add|commit|push|pull|merge|rebase|reset|checkout|switch|stash|cherry-pick|revert|tag|init|clone|clean)\b/i,
	/\b(?:set|add)-content\b/i,
	/\b(?:out-file|remove-item|move-item|copy-item|new-item|rename-item|start-process)\b/i,
	/\b(?:del|erase|rd|md)\b/i,
	/\b(?:sudo|su|kill|pkill|killall|reboot|shutdown)\b/i,
];

const READ_ONLY_COMMAND_PATTERNS = [
	/^\s*(?:cd|pushd|popd)\b/i,
	/^\s*(?:cat|head|tail|less|more|grep|find|ls|pwd|wc|sort|uniq|diff|file|stat|du|df|tree|which|whereis|type|env|printenv|uname|whoami|id|date|cal|uptime|ps|top|htop|free|jq|rg|fd|bat|eza)\b/i,
	/^\s*(?:echo|printf)\b/i,
	/^\s*(?:sed\s+-n|awk)\b/i,
	/^\s*git\s+(?:status|log|diff|show|branch|remote|rev-parse|ls-|config\s+--get)\b/i,
	/^\s*(?:npm|pnpm|yarn)\s+(?:list|ls|view|info|search|outdated|audit|why)\b/i,
	/^\s*(?:node|python|python3|pnpm|npm|yarn)\s+--version\b/i,
	/^\s*(?:get-content|get-childitem|get-item|get-location|get-command|get-process|select-string|resolve-path|test-path|measure-object|compare-object|format-list|format-table|set-location|push-location|pop-location)\b/i,
];

const PLAN_GUIDANCE = `

## Plan mode

You are in read-only planning mode. Inspect the repository and produce a decision-complete implementation plan; do not implement it.

- Use read, search, and static analysis to resolve discoverable facts.
- Do not edit files, mutate Git state, install dependencies, or run commands that change the workspace.
- The tool catalog intentionally stays stable across Plan transitions. Plan policy overrides descriptions that suggest mutation.
- Do not use todo_write for plan authoring. Todo state belongs to implementation after approval.
- Ask the user only for choices or ambiguity that repository inspection cannot resolve.
- When ready, call exit_plan_mode with the complete Markdown plan, beginning with a # heading. Make it the only and final tool call in that response.
`;

export const name = "plan-mode";
export const inject = ["tools", "extensions"];

function splitShellCommandSegments(command: string): string[] | undefined {
	const segments: string[] = [];
	let current = "";
	let quote: "'" | '"' | undefined;
	let escaped = false;

	for (let index = 0; index < command.length; index += 1) {
		const character = command[index];
		if (escaped) {
			current += character;
			escaped = false;
			continue;
		}
		if (character === "\\") {
			current += character;
			escaped = true;
			continue;
		}
		if (quote) {
			current += character;
			if (character === quote) quote = undefined;
			continue;
		}
		if (character === "'" || character === '"') {
			quote = character;
			current += character;
			continue;
		}
		if (character === "`" || ((character === "$" || character === "<") && command[index + 1] === "(")) {
			return undefined;
		}
		if (character === ";" || character === "\n" || character === "|" || character === "&") {
			const segment = current.trim();
			if (!segment) return undefined;
			segments.push(segment);
			current = "";
			if ((character === "|" || character === "&") && command[index + 1] === character) index += 1;
			continue;
		}
		current += character;
	}

	if (quote || escaped) return undefined;
	const finalSegment = current.trim();
	if (!finalSegment) return undefined;
	segments.push(finalSegment);
	return segments;
}

/** Return whether a shell command is allowlisted as read-only for Plan mode. */
export function isReadOnlyPlanCommand(command: string): boolean {
	if (!command.trim()) return false;
	if (DESTRUCTIVE_COMMAND_PATTERNS.some((pattern) => pattern.test(command))) return false;
	const segments = splitShellCommandSegments(command);
	return Boolean(
		segments?.length
		&& segments.every((segment) => READ_ONLY_COMMAND_PATTERNS.some((pattern) => pattern.test(segment))),
	);
}

/** Validate the review artifact accepted by `exit_plan_mode`. */
export function validatePlanMarkdown(plan: string): string | undefined {
	const normalized = plan.trim();
	if (!normalized) return "exit_plan_mode requires a non-empty Markdown plan";
	if (!/^#\s+\S/.test(normalized)) return "exit_plan_mode requires the plan to begin with a # heading";
	return undefined;
}

function sessionIdFromContext(context?: PiExecutionContext): string | undefined {
	try {
		return context?.sessionManager?.getSessionId?.();
	} catch {
		return undefined;
	}
}

function result(
	sessionId: string,
	active: boolean,
	approved: boolean,
	text: string,
	options: { feedback?: string; isError?: boolean; plan?: string } = {},
): PlanToolResult {
	return {
		content: [{ type: "text", text }],
		details: {
			active,
			approved,
			feedback: options.feedback,
			plan: options.plan,
			sessionId,
		},
		isError: options.isError,
	};
}

/** Mount stable per-session Plan controls and return their complete disposer. */
export function apply(ctx: Context, config: PlanModeConfig = {}) {
	const initialActive = config.initialActive ?? false;
	const blockMutations = config.blockMutations ?? true;
	const injectGuidelines = config.injectGuidelines ?? true;
	const states = new Map<string, PlanModeState>();
	let activeSessionId = DEFAULT_SESSION_ID;

	const stateFor = (sessionId: string): PlanModeState => {
		let state = states.get(sessionId);
		if (!state) {
			state = { active: initialActive };
			states.set(sessionId, state);
		}
		return state;
	};

	const setActive = (sessionId: string, active: boolean): PlanModeState => {
		const state = stateFor(sessionId);
		state.active = active;
		ctx.emit("pi/plan-mode-changed", { active, sessionId });
		return state;
	};

	const unregisterCommand = ctx.extensions.registerCommand("plan", {
		description: "Enter Plan mode, optionally submit a planning request, or leave it with /plan off",
		getArgumentCompletions: (prefix: string) => {
			const values = ["on", "off"].filter((value) => value.startsWith(prefix));
			return values.length > 0 ? values.map((value) => ({ value })) : null;
		},
		handler: (args: string, commandContext: PiExecutionContext) => {
			const sessionId = sessionIdFromContext(commandContext) ?? activeSessionId;
			const input = args.trim();
			const control = input.toLowerCase();
			const active = control !== "off";
			const request = input && control !== "on" && control !== "off" ? input : undefined;
			const previousActive = stateFor(sessionId).active;
			setActive(sessionId, active);
			try {
				if (request) {
					ctx.extensions.sendUserMessage(
						request,
						commandContext.isIdle?.() === false ? { deliverAs: "steer" } : undefined,
					);
				}
			} catch (cause) {
				setActive(sessionId, previousActive);
				throw new Error("Plan request was not submitted; the previous Plan state was restored.", { cause });
			}
			commandContext.ui?.notify?.(
				active
					? request
						? "Plan mode enabled. The request was submitted under read-only Plan policy."
						: "Plan mode enabled. Workspace mutations are blocked."
					: "Plan mode disabled.",
				"info",
			);
		},
	});

	const unregisterTool = ctx.tools.register({
		name: "exit_plan_mode",
		description: "Present a complete Markdown implementation plan for user review and leave Plan mode only after explicit approval.",
		parameters: {
			type: "object",
			properties: {
				plan: {
					type: "string",
					description: "Decision-complete Markdown plan beginning with a # heading",
				},
			},
			required: ["plan"],
		},
		renderCall: (args: { plan?: string }) => {
			const plan = args.plan?.trim();
			return plan ? `Plan proposed for approval:\n\n${plan}` : "Review plan";
		},
		execute: async (args: { plan: string }, executionContext?: ToolExecutionContext): Promise<PlanToolResult> => {
			const piContext = executionContext?.ctx;
			const sessionId = sessionIdFromContext(piContext) ?? activeSessionId;
			const state = stateFor(sessionId);
			if (!state.active) {
				return result(sessionId, false, false, "Error: exit_plan_mode is only available while Plan mode is active.", {
					isError: true,
				});
			}

			const submittedPlan = args.plan?.trim() ?? "";
			const validationError = validatePlanMarkdown(submittedPlan);
			if (validationError) {
				return result(sessionId, true, false, `Error: ${validationError}.`, { isError: true });
			}

			const ui = piContext?.ui;
			if (!piContext?.hasUI || !ui?.select) {
				return result(
					sessionId,
					true,
					false,
					"Error: interactive plan review is unavailable. Stay in Plan mode and ask the user to run /plan off if they want to proceed.",
					{ isError: true, plan: submittedPlan },
				);
			}

			if (ui.editor) {
				const reviewedPlan = await ui.editor(
					"Review the complete plan. Submit unchanged to continue to approval; cancel to keep planning.",
					submittedPlan,
				);
				if (reviewedPlan === undefined) {
					return result(sessionId, true, false, "Plan review cancelled. Remain in Plan mode.", {
						isError: true,
						plan: submittedPlan,
					});
				}
				const reviewed = reviewedPlan.trim();
				if (reviewed !== submittedPlan) {
					const reviewedValidationError = validatePlanMarkdown(reviewed);
					const feedback = reviewedValidationError
						? `The edited plan is invalid: ${reviewedValidationError}.`
						: "The user edited the plan during review. Submit the revised plan below again for explicit approval.";
					return result(sessionId, true, false, `Plan not approved. ${feedback}\n\n${reviewed}`, {
						feedback,
						isError: true,
						plan: reviewed,
					});
				}
			}

			const choice = await ui.select(
				ui.editor
					? "Approve the complete plan you just reviewed?"
					: `Review the complete plan before choosing:\n\n${submittedPlan}`,
				["Approve and leave Plan mode", "Keep planning", "Provide feedback"],
				{ signal: executionContext?.signal },
			);
			if (choice === "Approve and leave Plan mode") {
				state.lastApprovedPlan = submittedPlan;
				setActive(sessionId, false);
				ui.notify?.("Plan approved. Plan mode disabled; the active Profile is unchanged.", "info");
				return result(sessionId, false, true, "Plan approved. Continue implementation in the current Profile.", {
					plan: state.lastApprovedPlan,
				});
			}

			let feedback: string | undefined;
			if (choice === "Provide feedback" && ui.input) {
				feedback = (await ui.input("Plan feedback", "What should change?", { signal: executionContext?.signal }))?.trim();
			}
			const message = feedback
				? `Plan not approved. Revise it using this feedback: ${feedback}`
				: "Plan not approved. Remain in Plan mode and continue planning.";
			return result(sessionId, true, false, message, {
				feedback,
				isError: true,
				plan: submittedPlan,
			});
		},
	});

	const removeSessionStart = ctx.on("pi/session-start", (event) => {
		activeSessionId = event.sessionId ?? DEFAULT_SESSION_ID;
		stateFor(activeSessionId);
	});

	const removeToolGate = ctx.on("pi/tool-call", (event) => {
		if (!blockMutations) return;
		const sessionId = event.sessionId ?? activeSessionId;
		if (!stateFor(sessionId).active) return;
		const toolName = event.toolName ?? event.name ?? "";
		if (MUTATING_TOOLS.has(toolName)) {
			throw new Error(`[plan-mode] Tool "${toolName}" is blocked while Plan mode is active. Use exit_plan_mode or /plan off.`);
		}
		if (toolName === "bash") {
			const command = String(event.args?.command ?? "");
			if (!isReadOnlyPlanCommand(command)) {
				throw new Error(`[plan-mode] Shell command is not allowlisted as read-only. Use exit_plan_mode or /plan off. Command: ${command}`);
			}
		}
	});

	const removePromptHook = injectGuidelines
		? ctx.on("pi/prompt-transform", (event) => {
			const sessionId = event.sessionId ?? activeSessionId;
			if (stateFor(sessionId).active) event.prompt += PLAN_GUIDANCE;
		})
		: undefined;

	return () => {
		removePromptHook?.();
		removeToolGate();
		removeSessionStart();
		unregisterTool();
		unregisterCommand();
	};
}

export default { name, inject, apply };
