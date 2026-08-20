import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig, { workspaceSourcePaths } from "../../vitest.base.ts";

export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			globals: true,
			environment: "node",
			testTimeout: 30000,
			// Tests run offline by default; opt in with allowNetwork() from test/test-network-env.ts.
			env: { PI_OFFLINE: "1" },
			unstubEnvs: true,
			reporters: process.env.GITHUB_ACTIONS ? ["dot", "github-actions"] : ["dot"],
			silent: "passed-only",
			server: {
				deps: {
					external: [/@silvia-odwyer\/photon-node/],
				},
			},
		},
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
				{
					find: /^@earendil-works\/pi-client$/,
					replacement: fileURLToPath(new URL("../client/src/index.ts", import.meta.url)),
				},
				{
					find: /^@earendil-works\/pi-protocol$/,
					replacement: fileURLToPath(new URL("../protocol/src/index.ts", import.meta.url)),
				},
				{ find: /^@mariozechner\/pi-ai$/, replacement: (workspaceSourcePaths as any).aiIndex },
				{ find: /^@mariozechner\/pi-ai\/oauth$/, replacement: (workspaceSourcePaths as any).aiOAuth },
				{ find: /^@mariozechner\/pi-agent-core$/, replacement: (workspaceSourcePaths as any).agentIndex },
				{ find: /^@mariozechner\/pi-tui$/, replacement: (workspaceSourcePaths as any).tuiIndex },
			],
		},
	}),
);
