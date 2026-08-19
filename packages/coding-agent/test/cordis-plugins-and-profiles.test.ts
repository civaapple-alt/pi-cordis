import { describe, expect, it } from "vitest";
import { createPiContext } from "../src/core/cordis/index.ts";
import { BUILTIN_PROFILES, applyProfile } from "@pi-cordis/profiles";

describe("Cordis Native Plugins and Profiles System", () => {
	it("should define standard built-in profiles", () => {
		expect(BUILTIN_PROFILES.default).toBeDefined();
		expect(BUILTIN_PROFILES.safe).toBeDefined();
		expect(BUILTIN_PROFILES.strict).toBeDefined();
		expect(BUILTIN_PROFILES.full).toBeDefined();
		expect(BUILTIN_PROFILES.minimal).toBeDefined();
	});

	it("should initialize Pi context with default profile (rules-injector + todo-tracker)", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "default" });

		// Verify core services exist
		expect(ctx.settings).toBeDefined();
		expect(ctx.ai).toBeDefined();
		expect(ctx.tools).toBeDefined();

		// Verify todo tools registered by todo-tracker
		const toolNames = ctx.tools.getToolNames();
		expect(toolNames).toContain("todo_write");
		expect(toolNames).toContain("todo_read");
	});

	it("should support safe profile with safety-gate interceptor", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "safe" });

		// Trigger safety-gate on protected file write
		let blocked = false;
		try {
			await ctx.parallel("pi/tool-call", {
				name: "write",
				args: { path: ".env", content: "SECRET=123" },
			});
		} catch (err: any) {
			blocked = true;
			const msg = String(err) + (err.errors ? err.errors.map(String).join(" ") : "");
			expect(msg).toContain("safety-gate");
		}

		expect(blocked).toBe(true);
	});

	it("should block dangerous bash commands under safety-gate", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "safe" });

		let blocked = false;
		try {
			await ctx.parallel("pi/tool-call", {
				name: "bash",
				args: { command: "rm -rf /" },
			});
		} catch (err: any) {
			blocked = true;
			const msg = String(err) + (err.errors ? err.errors.map(String).join(" ") : "");
			expect(msg).toContain("Dangerous command blocked");
		}

		expect(blocked).toBe(true);
	});

	it("should support minimal profile without extra plugins", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "minimal" });
		const toolNames = ctx.tools.getToolNames();
		expect(toolNames).not.toContain("todo_write");
	});
});
