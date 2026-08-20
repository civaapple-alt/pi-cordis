import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export const workspaceSourcePaths = {
	codingAgentIndex: fileURLToPath(new URL("./packages/coding-agent/src/index.ts", import.meta.url)),
	cordisIndex: fileURLToPath(new URL("./vendor/cordis/src/index.ts", import.meta.url)),
	cosmokitIndex: fileURLToPath(new URL("./vendor/cosmokit/src/index.ts", import.meta.url)),
	schemasteryIndex: fileURLToPath(new URL("./vendor/schemastery/src/index.ts", import.meta.url)),
	profilesIndex: fileURLToPath(new URL("./packages/plugins/profiles/src/index.ts", import.meta.url)),
	safetyGateIndex: fileURLToPath(new URL("./packages/plugins/safety-gate/src/index.ts", import.meta.url)),
	gitGuardIndex: fileURLToPath(new URL("./packages/plugins/git-guard/src/index.ts", import.meta.url)),
	todoTrackerIndex: fileURLToPath(new URL("./packages/plugins/todo-tracker/src/index.ts", import.meta.url)),
	rulesInjectorIndex: fileURLToPath(new URL("./packages/plugins/rules-injector/src/index.ts", import.meta.url)),
	subagentIndex: fileURLToPath(new URL("./packages/plugins/subagent/src/index.ts", import.meta.url)),
	planModeIndex: fileURLToPath(new URL("./packages/plugins/plan-mode/src/index.ts", import.meta.url)),
	codeModeIndex: fileURLToPath(new URL("./packages/plugins/code-mode/src/index.ts", import.meta.url)),
	askQuestionIndex: fileURLToPath(new URL("./packages/plugins/ask-question/src/index.ts", import.meta.url)),
	outputTruncatorIndex: fileURLToPath(new URL("./packages/plugins/output-truncator/src/index.ts", import.meta.url)),
	contextCompactorIndex: fileURLToPath(new URL("./packages/plugins/context-compactor/src/index.ts", import.meta.url)),
	toolsManagerIndex: fileURLToPath(new URL("./packages/plugins/tools-manager/src/index.ts", import.meta.url)),
	sessionHandoffIndex: fileURLToPath(new URL("./packages/plugins/session-handoff/src/index.ts", import.meta.url)),
	gitAutomationIndex: fileURLToPath(new URL("./packages/plugins/git-automation/src/index.ts", import.meta.url)),
	sshDelegatorIndex: fileURLToPath(new URL("./packages/plugins/ssh-delegator/src/index.ts", import.meta.url)),
} as const;

export default defineConfig({
	resolve: {
		alias: [
			{ find: /^@deepseek-ai\/cordis$/, replacement: workspaceSourcePaths.cordisIndex },
			{ find: /^@deepseek-ai\/cosmokit$/, replacement: workspaceSourcePaths.cosmokitIndex },
			{ find: /^@deepseek-ai\/schemastery$/, replacement: workspaceSourcePaths.schemasteryIndex },
			{ find: /^@pi-cordis\/profiles$/, replacement: workspaceSourcePaths.profilesIndex },
			{ find: /^@pi-cordis\/plugin-safety-gate$/, replacement: workspaceSourcePaths.safetyGateIndex },
			{ find: /^@pi-cordis\/plugin-git-guard$/, replacement: workspaceSourcePaths.gitGuardIndex },
			{ find: /^@pi-cordis\/plugin-todo-tracker$/, replacement: workspaceSourcePaths.todoTrackerIndex },
			{ find: /^@pi-cordis\/plugin-rules-injector$/, replacement: workspaceSourcePaths.rulesInjectorIndex },
			{ find: /^@pi-cordis\/plugin-subagent$/, replacement: workspaceSourcePaths.subagentIndex },
			{ find: /^@pi-cordis\/plugin-plan-mode$/, replacement: workspaceSourcePaths.planModeIndex },
			{ find: /^@pi-cordis\/plugin-code-mode$/, replacement: workspaceSourcePaths.codeModeIndex },
			{ find: /^@pi-cordis\/plugin-ask-question$/, replacement: workspaceSourcePaths.askQuestionIndex },
			{ find: /^@pi-cordis\/plugin-output-truncator$/, replacement: workspaceSourcePaths.outputTruncatorIndex },
			{ find: /^@pi-cordis\/plugin-context-compactor$/, replacement: workspaceSourcePaths.contextCompactorIndex },
			{ find: /^@pi-cordis\/plugin-tools-manager$/, replacement: workspaceSourcePaths.toolsManagerIndex },
			{ find: /^@pi-cordis\/plugin-session-handoff$/, replacement: workspaceSourcePaths.sessionHandoffIndex },
			{ find: /^@pi-cordis\/plugin-git-automation$/, replacement: workspaceSourcePaths.gitAutomationIndex },
			{ find: /^@pi-cordis\/plugin-ssh-delegator$/, replacement: workspaceSourcePaths.sshDelegatorIndex },
		],
	},
});
