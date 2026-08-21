# Pi-Cordis Experience-First Built-in Plugin Contracts

English | [中文](2026-08-21-pi-cordis-experience-first-built-in-plugin-contracts.zh.md)

Status: implemented

## Decision

Pi-Cordis evaluates every built-in plugin from an observable user or developer journey before treating its tool schema, implementation, or passing unit tests as complete. Each journey states the expected visible artifact, allowed state transition, cancellation behavior, failure semantics, lifecycle owner, and evidence required for release.

This extends Pi's minimalist philosophy rather than adding another orchestration layer: Cordis owns reversible policy and composition, while Pi continues to own the TUI and agent loop. Plugins use that narrow seam to make important outcomes visible, exact, and reversible.

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

## Implemented behavior

### Release blockers

- Plan policy covers semantic `workspace` and `external` side effects, including `git_checkpoint restore`, instead of relying only on upstream tool names. Restore also requires an interactive confirmation.
- Todo state is session-scoped outside disposable Profile state. Updates validate a candidate copy before committing it, so rejected transitions are atomic.
- Cordis tool results normalize `isError`, `success: false`, and non-empty `error` into Pi failures; renderers distinguish errors and cancellations from success.
- `ask_question` stops a batch immediately on cancel and provides a full preview/confirm/back path for option artifacts.
- Safety Gate distinguishes `/dev/null` suppression from writes to actual block devices.
- Profile switching exposes the current Profile and capability delta. Profile and HMR cleanup failures are reported rather than swallowed.
- Code Mode honors cancellation by terminating its Worker. Worker startup failure is explicit; VM is used only when configured and is marked degraded.

### Review surfaces and developer observability

- `/btw` answers use a complete scrollable review surface when Pi provides one, and expanded Session Handoff results include the complete Markdown artifact.
- `git_smart_commit` returns a structured executable/argument tuple for guarded execution, while its user-facing instruction remains non-executable prose.
- `/rules` exposes the exact injected files, byte count, hash, and complete rule block. Spill notices already expose the recoverable path only after persistence succeeds.
- `manage_tools` rejects missing targets and unknown actions explicitly. Terminal waiting notifications are suppressed when no interactive UI exists.

## Verification

- Core and plugin regression suites cover session isolation, cancellation, atomic failure, complete artifact visibility, Profile transitions, HMR cleanup failure, Plan mutation interception, headless/cancelled Git restore, and Worker backend disclosure.
- Tool bridge tests prove that failed Cordis results reach Pi with `isError: true`.
- TypeScript strict checks and the repository release gate validate the publishable dependency graph and package artifacts.
- Pi-compatible UI integration tests cover complete Plan/editor review and option previews. Focused real-TUI smoke tests cover startup, `/plan`, `/rules`, and Profile selection/switch deltas on the actual Pi bridge.

## Consequences

- The side-effect taxonomy intentionally remains three values and stays in the existing tool pipeline; it is policy metadata, not a second permission system.
- Session continuity uses Pi session IDs forwarded by `ExtensionService` and root-scoped Cordis storage; Pi remains the session kernel.
- Full artifacts use Pi's scrollable editor or expanded tool result, while collapsed summaries stay concise.
- VM execution remains available for deliberate compatibility, but its inability to terminate synchronous JavaScript is explicit and never presented as Worker-equivalent isolation.
