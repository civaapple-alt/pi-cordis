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
		],
	},
});
