import { Worker } from "node:worker_threads";
import type { CodeExecutionResult } from "./index.js";

export interface RunWorkerOptions {
	code: string;
	timeoutMs: number;
	toolNames: string[];
	callTool: (name: string, args: any) => Promise<any>;
}

export function createWorkerScript(): string {
	return `
const { parentPort, workerData } = require("node:worker_threads");

const pendingCalls = new Map();

parentPort.on("message", (msg) => {
	if (msg.type === "tool_response") {
		const deferred = pendingCalls.get(msg.callId);
		if (deferred) {
			pendingCalls.delete(msg.callId);
			if (msg.error) {
				deferred.reject(new Error(msg.error));
			} else {
				deferred.resolve(msg.result);
			}
		}
	}
});

function callHostTool(toolName, args) {
	const callId = Math.random().toString(36).slice(2) + Date.now().toString(36);
	return new Promise((resolve, reject) => {
		pendingCalls.set(callId, { resolve, reject });
		parentPort.postMessage({ type: "tool_call", callId, toolName, args });
	});
}

const flatTools = {};
for (const name of (workerData.toolNames || [])) {
	flatTools[name] = (args) => callHostTool(name, args);
}

const fsNamespace = {
	read: flatTools.read || ((a) => callHostTool("read", a)),
	write: flatTools.write || ((a) => callHostTool("write", a)),
	edit: flatTools.edit || ((a) => callHostTool("edit", a)),
	patch: flatTools.patch || flatTools.apply_patch || ((a) => callHostTool("patch", a)),
	list: flatTools.ls || flatTools.find || ((a) => callHostTool("find", a)),
	find: flatTools.find || ((a) => callHostTool("find", a)),
	grep: flatTools.grep || ((a) => callHostTool("grep", a)),
};

const bashNamespace = {
	exec: flatTools.bash || ((a) => callHostTool("bash", a)),
	run: (command) => callHostTool("bash", { command }),
};

const piSdk = {
	...flatTools,
	fs: fsNamespace,
	bash: bashNamespace,
};

globalThis.pi = piSdk;

const logCollector = (...vals) => {
	const text = vals
		.map((v) => (typeof v === "object" && v !== null ? JSON.stringify(v, null, 2) : String(v)))
		.join(" ");
	parentPort.postMessage({ type: "log", level: "log", message: text });
};

console.log = logCollector;
console.info = logCollector;
console.warn = (...vals) => parentPort.postMessage({ type: "log", level: "warn", message: "[WARN] " + vals.map(String).join(" ") });
console.error = (...vals) => parentPort.postMessage({ type: "log", level: "error", message: "[ERROR] " + vals.map(String).join(" ") });
console.dir = logCollector;
console.table = logCollector;

(async () => {
	try {
		const fn = new Function(
			"pi",
			"console",
			"Promise",
			"Array",
			"Object",
			"JSON",
			"Math",
			"Date",
			"Buffer",
			"URL",
			"URLSearchParams",
			\`return (async () => {
\${workerData.code}
})();\`
		);
		await fn(piSdk, console, Promise, Array, Object, JSON, Math, Date, Buffer, URL, URLSearchParams);
		parentPort.postMessage({ type: "done", success: true });
	} catch (err) {
		parentPort.postMessage({ type: "done", success: false, error: err?.message || String(err) });
	}
})();
`;
}

export async function executeInWorkerThread(options: RunWorkerOptions): Promise<CodeExecutionResult> {
	const startTime = Date.now();
	const logs: string[] = [];
	const workerScript = createWorkerScript();

	return new Promise((resolve) => {
		let isSettled = false;
		let timeoutTimer: NodeJS.Timeout | null = null;

		const worker = new Worker(workerScript, {
			eval: true,
			workerData: {
				code: options.code,
				toolNames: options.toolNames,
			},
		});

		const cleanup = () => {
			if (timeoutTimer) {
				clearTimeout(timeoutTimer);
				timeoutTimer = null;
			}
			worker.removeAllListeners();
		};

		timeoutTimer = setTimeout(async () => {
			if (isSettled) return;
			isSettled = true;
			cleanup();
			await worker.terminate();
			resolve({
				success: false,
				output: logs.join("\n"),
				error: `Execution timed out after ${options.timeoutMs}ms (Worker thread terminated)`,
				executionTimeMs: Date.now() - startTime,
			});
		}, options.timeoutMs);

		worker.on("message", async (msg) => {
			if (msg.type === "log") {
				logs.push(msg.message);
			} else if (msg.type === "tool_call") {
				try {
					const result = await options.callTool(msg.toolName, msg.args);
					try {
						worker.postMessage({ type: "tool_response", callId: msg.callId, result });
					} catch {
						try {
							const safeResult = JSON.parse(JSON.stringify(result));
							worker.postMessage({ type: "tool_response", callId: msg.callId, result: safeResult });
						} catch {
							worker.postMessage({ type: "tool_response", callId: msg.callId, result: String(result) });
						}
					}
				} catch (err: any) {
					worker.postMessage({ type: "tool_response", callId: msg.callId, error: err?.message || String(err) });
				}
			} else if (msg.type === "done") {
				if (isSettled) return;
				isSettled = true;
				cleanup();
				await worker.terminate();
				resolve({
					success: msg.success,
					output: logs.join("\n") || "(Execution completed with no output)",
					error: msg.error,
					executionTimeMs: Date.now() - startTime,
				});
			}
		});

		worker.on("error", async (err) => {
			if (isSettled) return;
			isSettled = true;
			cleanup();
			await worker.terminate();
			resolve({
				success: false,
				output: logs.join("\n"),
				error: err.message,
				executionTimeMs: Date.now() - startTime,
			});
		});

		worker.on("exit", (code) => {
			if (isSettled) return;
			isSettled = true;
			cleanup();
			resolve({
				success: code === 0,
				output: logs.join("\n"),
				error: code !== 0 ? `Worker stopped with exit code ${code}` : undefined,
				executionTimeMs: Date.now() - startTime,
			});
		});
	});
}
