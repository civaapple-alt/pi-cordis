import { describe, it, expect } from "vitest";
import { createPiContext } from "../src/core/cordis/index.ts";

describe("Pi-Cordis Microkernel Bootstrap", () => {
	it("boots Cordis Context and injects all core Pi services", async () => {
		const ctx = await createPiContext({
			cwd: process.cwd(),
			allowModelNetwork: false,
		});

		expect(ctx).toBeDefined();
		expect(ctx.settings).toBeDefined();
		expect(ctx.auth).toBeDefined();
		expect(ctx.ai).toBeDefined();
		expect(ctx.tools).toBeDefined();
		expect(ctx.session).toBeDefined();
		expect(ctx.skills).toBeDefined();
		expect(ctx.prompts).toBeDefined();
		expect(ctx.extensions).toBeDefined();
		expect(ctx.packageManager).toBeDefined();
		expect(ctx.agent).toBeDefined();

		// Test Tools Service
		const allTools = ctx.tools.getAllToolDefinitions();
		expect(allTools.length).toBeGreaterThanOrEqual(7);
		const toolNames = allTools.map((t) => t.name);
		expect(toolNames).toContain("read");
		expect(toolNames).toContain("write");
		expect(toolNames).toContain("edit");
		expect(toolNames).toContain("bash");
		expect(toolNames).toContain("grep");
		expect(toolNames).toContain("find");
		expect(toolNames).toContain("ls");

		// Test AIService
		const models = ctx.ai.getModels();
		expect(models.length).toBeGreaterThan(0);

		// Test SessionService
		const inMemorySession = ctx.session.inMemory();
		expect(inMemorySession).toBeDefined();
		expect(inMemorySession.getSessionFile()).toBeUndefined();

		// Test Events
		let eventFired = false;
		ctx.on("pi/prompt-transform", (evt) => {
			eventFired = true;
			expect(evt.prompt).toBe("hello cordis");
		});

		ctx.emit("pi/prompt-transform", { prompt: "hello cordis" });
		expect(eventFired).toBe(true);
	});
});
