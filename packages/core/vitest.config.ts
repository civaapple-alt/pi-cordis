import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig, { workspaceSourcePaths } from "../../vitest.base.ts";

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			globals: true,
			environment: "node",
			testTimeout: 30000,
			env: { PI_OFFLINE: "1" },
			unstubEnvs: true,
			reporters: process.env.GITHUB_ACTIONS ? ["dot", "github-actions"] : ["dot"],
			silent: "passed-only",
		},
		resolve: {
			alias: [
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
	}),
);
