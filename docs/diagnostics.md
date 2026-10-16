# Development diagnostics

Enable inspection for a root by passing `debug: true` when creating or mounting the app. `app.inspect()` returns a deeply frozen, detached snapshot. Calling it does not evaluate expressions or formatters, subscribe to state, start requests, or retain DOM nodes.

```js
const app = PlainUI.mount(document.querySelector('[ui-app]'), { debug: true });
await app.ready;
console.log(app.inspect());
```

The snapshot reports the root ID and lifecycle, owners grouped by kind, live bindings, subscribers, timers, listeners, queued jobs, pending actions, cache entries, shared transports, resource consumers, fragment ranges, and range consumers. Resource entries contain only a generated ID, status flags, `updatedAt`, and `error.kind`, `error.code`, and `error.status`. They never contain resource data, request URLs, query strings, headers, bodies, persisted state, request IDs, field errors, or backend messages.

Inspection is a development feature. With the default `debug: false`, `app.inspect()` throws `INSPECTOR_DISABLED`. `app.onDiagnostic()` remains available in production and emits stable codes with redacted locations. The runnable example in [`examples/diagnostics`](../examples/diagnostics/) prints the current snapshot through the public API.
