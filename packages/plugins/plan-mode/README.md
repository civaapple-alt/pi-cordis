# @pi-cordis/plugin-plan-mode

English | [中文](README.zh.md)

Native Cordis structured planning mode and plan document orchestration plugin. Through the `plan_step` tool, it provides **automatic generation and real-time synchronization of `implementation_plan.md`**, **User Review & Approval Gates**, **continuous in-flight plan inspection**, and **post-execution Walkthrough summaries (`walkthrough.md`)**.

---

## 🌟 Key Capabilities

1. **Automatic `implementation_plan.md` Generation & Sync**:
   - Structured sections: Overview & Background, User Review Required & Open Questions, Proposed Changes table (`[NEW]`, `[MODIFY]`, `[DELETE]`), Step Dependency Graph, and Verification Plan;
   - Persisted to `.pi/plans/implementation_plan.md` and continuously kept in sync as steps progress.
2. **User Review & Approval Gate**:
   - Mutating tools (`write`, `edit`, `patch`, `apply_patch`) are strictly blocked until the user reviews and approves the plan;
   - Supports `action: "request_review"` to request user approval, and `action: "approve"` to unblock modification tools.
3. **Continuous In-flight Plan Inspection (Live Inspection)**:
   - Users and models can run `action: "view"` or `action: "get_plan"` at any time to inspect the full plan Markdown, progress bar, and step statuses.
4. **Post-Execution Walkthrough (`walkthrough.md`)**:
   - Calling `action: "finish"` generates a comprehensive walkthrough summarizing completed deliverables, changes breakdown, and verification proofs.

---

## 🛠️ Tool: `plan_step`

### Parameters
- `action` (required):
  - `"set_plan"`: Sets or updates plan metadata (title, overview, userReviewRequired, openQuestions, proposedChanges, verificationPlan);
  - `"add"`: Adds a new step;
  - `"update"`: Updates step status (`pending` | `in_progress` | `completed` | `failed`);
  - `"request_review"`: Requests user review of the plan;
  - `"approve"`: Approves the plan, unblocking write/edit tools;
  - `"view"` / `"get_plan"`: Retrieves the current plan Markdown, path, and progress;
  - `"finish"`: Finalizes the plan, optionally generating `walkthrough.md`;
  - `"list"`: Lists all steps.
- `id` (number, optional): Step ID.
- `title` (string, optional): Plan title or step description.
- `overview` (string, optional): Background and objective overview.
- `userReviewRequired` (string, optional): Critical design decisions or breaking changes for user review.
- `openQuestions` (string[], optional): Open questions requiring user clarification.
- `proposedChanges` (array, optional): List of files/components to be changed.
- `verificationPlan` (string, optional): Automated and manual testing strategy.
- `status` (string, optional): `"pending"` | `"in_progress"` | `"completed"` | `"failed"`.
- `dependsOn` (number[], optional): IDs of dependent prior steps.
- `notes` (string, optional): Notes or rationale for a step.
- `summary` (string, optional): Executive summary of completed work for walkthrough.
