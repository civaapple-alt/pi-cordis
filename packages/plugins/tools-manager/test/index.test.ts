import { describe, expect, it } from "vitest";
import { createPiContext } from "../../../core/src/core/cordis/bootstrap.js";
import toolsManagerPlugin from "../src/index.js";

describe("tools-manager lifecycle", () => {
	it("changes exported tools and restores visibility after disposal", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "minimal" });
		const fork = await ctx.plugin(toolsManagerPlugin);
		const tool = ctx.tools.get("manage_tools")!;

		await tool.execute({ action: "disable", toolName: "read" });
		expect(ctx.tools.getExportedToolNames()).not.toContain("read");
		expect(ctx.tools.getExportedToolNames()).toContain("manage_tools");

		await tool.execute({ action: "enable", toolName: "read" });
		expect(ctx.tools.getExportedToolNames()).toContain("read");
		expect((await tool.execute({ action: "enable", toolName: "missing" })).error).toContain("does not exist");

		const removeExternalFilter = ctx.tools.addFilter((definition) => definition.name !== "write");
		const listed = await tool.execute({ action: "list" });
		expect(listed.active).not.toContain("write");
		removeExternalFilter();

		await fork.dispose();
		expect(ctx.tools.getExportedToolNames()).toContain("read");
		expect(ctx.tools.has("manage_tools")).toBe(false);
	});
});
