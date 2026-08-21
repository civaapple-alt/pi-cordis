# ExtensionService (`ctx.extensions`)

English | [中文](extension-service.zh.md)

`ExtensionService` is the narrow bridge between Cordis policy and Pi's interactive Extension API.

It provides:

- reversible Cordis command stacks, dispatched through stable Pi command proxies;
- adapters from Cordis tools to Pi tool definitions and `setActiveTools()` synchronization;
- serial pre-execution (`pi/tool-call`) and post-execution (`pi/tool-result`) pipelines;
- serial prompt transformation before an agent turn;
- forwarding for session, agent, turn, tool, and model-selection events;
- session IDs resolved from Pi's live `ExtensionContext` for session, prompt, and tool-call envelopes;
- dynamic provider registration/unregistration forwarding;
- guarded `sendUserMessage()` forwarding for Cordis commands after Pi's runtime becomes active;
- Pi `ExtensionContext` forwarding to tool execution so plugins can use real `ui.select`, `ui.input`, and `ui.notify` handles.
- normalization of Cordis tool failures (`isError`, `success: false`, or a non-empty `error`) into Pi error results, so presentation cannot make a failed operation look successful.

Pi currently has no command-unregistration API. A disposed command proxy therefore remains in Pi's command catalog but refuses execution with an “unavailable in the active profile” notice. It never calls the disposed handler. Tool definitions and providers are registered during Pi's extension-loading phase; the first `setActiveTools()` synchronization is deferred to `session_start`, after Pi binds runtime-only action methods. Later profile and tool changes synchronize immediately.

`sendUserMessage(content, options)` follows the same runtime boundary. It forwards to Pi only between `session_start` and `session_shutdown`, and fails explicitly outside that interval. This lets commands such as `/plan <request>` trigger a real user turn without reaching around the Cordis service seam or calling Pi action methods during extension loading.

`load()` is an SDK-side wrapper around Pi extension discovery. The interactive CLI still lets upstream Pi own its ordinary extension discovery; Pi-Cordis injects only the hidden Cordis bridge factory.

Prompt-transform, tool-registration, tool-visibility, and result-transform failures propagate rather than silently discarding control-plane failures. Result listeners may replace `event.result`; the final value is returned to Pi. Renderer failures alone degrade to an empty component so cosmetic plugin errors do not terminate the agent loop.
