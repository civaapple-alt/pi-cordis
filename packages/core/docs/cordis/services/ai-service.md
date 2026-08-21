# AIService (`ctx.ai`)

English | [中文](ai-service.zh.md)

`AIService` owns a Pi `ModelRuntime` for Cordis-side model queries such as `/btw`. It consumes Pi's installed model catalog and credential format; Pi-Cordis does not copy provider catalogs.

- `getModels()`, `getAvailableModels()`, and `getModel()` query that runtime.
- `switchModel()` returns `Promise<boolean>`. In the interactive CLI, the Extension bridge delegates to Pi's `setModel()` and mirrors `model_select` back to `ctx.ai.activeModel`; in SDK-only use it updates the Cordis-side selection.
- `registerProvider()` and `registerNativeProvider()` use reversible registration stacks. The active registration is also forwarded to the interactive Pi Extension API, and disposal restores a shadowed registration when present.
- `getRegisteredProviders()` exposes active dynamic registrations for bridge replay.

Events: `pi/model-change`, `pi/provider-registered`, and `pi/provider-unregistered`.

The Cordis-side `ModelRuntime` and Pi interactive session remain distinct runtime objects. The bridge synchronizes selected models and dynamic provider registrations; it does not replace Pi's agent loop.
