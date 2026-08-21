import { describe, expect, it } from "vitest";
import { isReadOnlyPlanCommand, validatePlanMarkdown } from "../src/index.ts";

describe("plan-mode policy helpers", () => {
	it("accepts inspection commands and rejects workspace mutations", () => {
		expect(isReadOnlyPlanCommand("git status")).toBe(true);
		expect(isReadOnlyPlanCommand("Get-ChildItem packages")).toBe(true);
		expect(isReadOnlyPlanCommand("rg -n plan packages")).toBe(true);
		expect(isReadOnlyPlanCommand("git status; git commit -am test")).toBe(false);
		expect(isReadOnlyPlanCommand("echo changed > file.txt")).toBe(false);
		expect(isReadOnlyPlanCommand("Set-Content file.txt changed")).toBe(false);
		expect(isReadOnlyPlanCommand("unknown-command")).toBe(false);
	});

	it("requires a non-empty Markdown plan beginning with a heading", () => {
		expect(validatePlanMarkdown("# Implementation\n\n1. Change code.")).toBeUndefined();
		expect(validatePlanMarkdown("")).toContain("non-empty");
		expect(validatePlanMarkdown("1. Change code.")).toContain("# heading");
		expect(validatePlanMarkdown("Intro first.\n\n# Implementation")).toContain("# heading");
	});
});
