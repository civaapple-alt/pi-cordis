# Pi-Cordis Experience-First Built-in Plugin Contracts

English | [中文](2026-08-21-pi-cordis-experience-first-built-in-plugin-contracts.zh.md)

Status: proposed

## Proposal

Pi-Cordis will evaluate every built-in plugin from an observable user or developer journey before treating its tool schema, implementation, or passing unit tests as complete. Each journey states the expected visible artifact, allowed state transition, cancellation behavior, failure semantics, lifecycle owner, and evidence required for release.

This proposal extends Pi's minimalist philosophy rather than adding another orchestration layer: Cordis owns reversible policy and composition, while Pi continues to own the TUI and agent loop. Plugins must use that narrow seam to make important outcomes visible, exact, and reversible.

## Experience contract

Every interactive command or tool must answer these questions:

1. What did the user intend to accomplish in this scenario?
2. What complete artifact or state change must the user be able to inspect?
3. What happens on cancel, missing UI, timeout, or dependency failure?
4. Is failure atomic, or can a rejected action leave partial state behind?
5. Which session and Fiber own the state, and what survives a Profile switch?
6. Which side effects can occur, and which policy gate sees them?
7. Which regression test proves the real user journey rather than only the helper function?

Success styling is reserved for successful outcomes. Cancellation, unavailable UI, rejected actions, and `{ success: false }` results must remain machine-visible and visibly distinct. Generated plans, answers, handoffs, diffs, and proposed commands must expose their complete review artifact before approval or reuse.

## Audit findings and intended changes

### Release blockers

- Plan policy will cover built-in mutation capabilities such as `git_checkpoint restore`, not only a fixed list of upstream tool names.
- Todo state will be session-scoped outside disposable Profile state. Updates will validate a candidate value before committing it, so rejected transitions are atomic.
- Cordis tools will use a normalized result contract with explicit `isError`; TUI renderers will not paint errors or cancellations as success.
- `ask_question` will stop a batch immediately on cancel and provide a readable preview path for option artifacts.
- Safety Gate will distinguish `/dev/null` suppression from writes to block devices.
- Profile switching will expose the current Profile and capability delta, and will not report success when old Fiber disposal fails.
- Code Mode will honor cancellation and disclose whether execution used Worker isolation or a degraded VM fallback.

### Follow-up usability

- `/btw` answers and session handoff Markdown will have complete, scrollable review surfaces rather than notification-only or summary-only rendering.
- `git_smart_commit` will return data for review without presenting an unsafe copy-paste shell command.
- Rules injection, spill persistence, and HMR will expose active state and degraded/error conditions to developers without adding noise to the default path.

## Acceptance criteria

- Default and PTC journeys have regression coverage for session isolation, cancellation, atomic failure, complete artifact visibility, Profile transitions, and Plan mutation interception.
- Every built-in mutating action declares or enforces its side-effect policy.
- Tool failures reach Pi with `isError: true` and render without success marks.
- Profile and HMR transitions either complete fully or report the exact incomplete cleanup; no swallowed lifecycle failure is described as success.
- `pnpm release:check` passes, followed by focused real-TUI smoke tests for slash commands, interactive questions, Plan review, and Profile switching.

## Risks

- A generic side-effect taxonomy can become heavier than the small plugin surface. Start with the minimum metadata needed by current built-ins and keep policy enforcement in the existing tool pipeline.
- Preserving session state across Profile switches must not create a second session kernel. Use Pi session IDs forwarded by `ExtensionService` and root-scoped Cordis ownership.
- Full artifact rendering can overwhelm the terminal. Prefer Pi's scrollable editor or expandable tool result, with concise collapsed summaries.

