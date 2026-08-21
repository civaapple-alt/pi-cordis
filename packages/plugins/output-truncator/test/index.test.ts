import { describe, expect, it } from "vitest";
import { createPiContext } from "../../../core/src/core/cordis/bootstrap.js";
import outputTruncatorPlugin, { truncateText } from "../src/index.js";

describe("output-truncator lifecycle", () => {
	it("transforms nested Pi text blocks and stops after disposal", async () => {
		const ctx = await createPiContext({ allowModelNetwork: false, profile: "minimal" });
		const fork = ctx.plugin(outputTruncatorPlugin, {
			maxBytes: 200,
			maxLines: 2,
			enableSpill: false,
		});
		ctx.tools.register({
			name: "large_result",
			description: "large nested result",
			execute: async () => ({
				content: [{ type: "text", text: "one\ntwo\nthree\nfour" }],
			}),
		});

		const truncated = await ctx.tools.executeTool("large_result", {});
		expect(truncated.content[0].text).toContain("Truncated");

		await fork.dispose();
		const original = await ctx.tools.executeTool("large_result", {});
		expect(original.content[0].text).toBe("one\ntwo\nthree\nfour");
	});

	it("keeps multibyte long-line output within the configured byte ceiling", () => {
		const text = "界".repeat(1_000);
		const result = truncateText(text, { maxBytes: 256, maxLines: 2, enableSpill: false });
		expect(result.truncated).toBe(true);
		expect(Buffer.byteLength(result.text, "utf8")).toBeLessThanOrEqual(256);
		expect(result.text).toContain("Truncated");
	});
});
