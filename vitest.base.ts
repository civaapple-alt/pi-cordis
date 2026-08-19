import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export const workspaceSourcePaths = {
	codingAgentIndex: fileURLToPath(new URL("./packages/coding-agent/src/index.ts", import.meta.url)),
	cordisIndex: fileURLToPath(new URL("./vendor/cordis/src/index.ts", import.meta.url)),
	cosmokitIndex: fileURLToPath(new URL("./vendor/cosmokit/src/index.ts", import.meta.url)),
	schemasteryIndex: fileURLToPath(new URL("./vendor/schemastery/src/index.ts", import.meta.url)),
} as const;

export default defineConfig({
	resolve: {
		alias: [
			{ find: /^@deepseek-ai\/cordis$/, replacement: workspaceSourcePaths.cordisIndex },
			{ find: /^@deepseek-ai\/cosmokit$/, replacement: workspaceSourcePaths.cosmokitIndex },
			{ find: /^@deepseek-ai\/schemastery$/, replacement: workspaceSourcePaths.schemasteryIndex },
		],
	},
});
