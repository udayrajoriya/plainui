# Public API reference

PlainUI 1.0.0 exports `PlainUI`, `getModuleBridge`, and the documented types `AppScaffold`, `OfficialModuleBridge`, `PlainUIApp`, `ScopeApi`, `ReadonlyJson`, `SafeEventSnapshot`, `CommandContext`, `BehaviorFactory`, `AdapterDefinition`, `NormalizedRequestError`, `ResourceRecord`, `ActionRecord`, `RouteRecord`, `ModuleInstaller`.

`PlainUI.create(options)` returns an unmounted `PlainUIApp`; register commands, formatters, behaviors, adapters, and optional modules before `mount(root)`. `PlainUI.mount(root, options)` is the convenience form. `ready` resolves after initial activation and rejects on root-fatal boot failure. `unmount()` is synchronous, idempotent, aborts owned work, and makes the App terminal.

`get` returns detached `ReadonlyJson`; writes use `set` or synchronous `batch`. App-level names resolve only application scope. `CommandContext.scope` and behavior `ScopeApi` resolve lexically, expose an abort `signal`, and reject use after disposal. Behavior `afterFlush` returns a cancellation function. Resource and action records are read-only snapshots.

`onDiagnostic` subscribes to safe structured diagnostics. `inspect` is available only when debug mode is enabled and returns redacted detached data. `beforeNavigate` installs an abort-aware router guard. Official `ModuleInstaller` functions must run before mount. `OfficialModuleBridge` and `AppScaffold` support the separately shipped official modules; application extensions use the registration methods rather than the bridge.

Adapters identify a version and may prepare requests or normalize success/error outcomes. Async work must observe its abort signal. Values passed across the public boundary are normalized JSON; DOM objects and mutable backend payloads are excluded.
