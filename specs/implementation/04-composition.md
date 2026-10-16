# Component and routing tasks

Component lexical scope, DOM ownership, and navigation lifetime are separate concerns. Use the ownership service for every range; no module may remove another module's nodes directly.

## T047 Discover and validate inline component definitions

**Status:** completed 16 October 2026. [Completion evidence](../../evidence/tasks/T047.md).

**Depends on:** T016,T025. **Sources:** RFC §11; C10. **Files:** `packages/components/src/{registry,definition,discover}.ts`.

1. Before instance activation, scan owned declaration positions for native template[ui-component], including declarations appearing after instances. Do not discover definitions inside uninstantiated route/loop/conditional bodies as new global registries.
2. Validate a lowercase hyphenated custom-element-compatible name, reject ui- prefix and existing customElements definitions, and reject duplicate root-local names.
3. Parse ui-props with safe JSON; validate schema keys/types/defaults/required conflicts exactly as C10 states. Compile definition ui-state as per-instance component state.
4. Capture immutable template source plus compiled reusable plan; do not mutate the original template while instantiating.
5. Validate duplicate slot placeholder names and static local ID duplicates within a definition. Record static local ID references for T051.
6. Freeze registry at mount activation. A definition failure prevents only affected instances; other valid definitions and ordinary DOM continue.

**Acceptance:** `component.forward-definition`, `component.duplicate`, `component.ui-prefix`, `component.custom-element-collision`, `component.bad-schema`, `component.immutable`, `component.other-root-same-name` pass.

## T048 Implement explicit component import graph

**Status:** completed 16 October 2026. [Completion evidence](../../evidence/tasks/T048.md).

**Depends on:** T007,T012,T029,T047. **Sources:** RFC §11; Design §10; C10. **Files:** `components/src/imports/{resolve,load,parse,graph}.ts`.

1. Resolve top-level and nested import URLs using C10, enforce same origin and HTTP(S), remove URL hash, reject userinfo, and include canonical URL in root-local graph identity.
2. Fetch once per root with same-origin credentials, redirect:error, app timeout, root signal, and text/html content type requirement. Share a promise for duplicate imports.
3. Parse with the private inert template service proved in T007. Accept only definition templates, import templates, whitespace, and comments at top level. Reject scripts/styles at every depth, including inside definitions; do not execute/install them.
4. Traverse DFS with visiting/visited sets and report the full canonical pathname cycle without sensitive query values. A→B→A fails deterministically.
5. Resolve dependencies before registering dependent definitions; reject duplicate definitions across files. Record failed URLs so repeated instances do not refetch endlessly.
6. Bound each request by timeout and all work by root signal. Resolve app.ready after import graph settles, including localized failures; unrelated static bindings can render during loading.

**Acceptance:** `import.once-per-root`, `import.nested-relative`, `import.cycle`, `import.cross-origin`, `import.redirect`, `import.script-style`, `import.timeout-localized`, `import.unmount` pass.

## T049 Implement literal and reactive props

**Status:** completed 16 October 2026. [Completion evidence](../../evidence/tasks/T049.md).

**Depends on:** T013,T047,T048. **Sources:** RFC §11. **Files:** `components/src/props/{compile,validate,connect}.ts`.

1. Match declared prop names exactly, retaining kebab case. String literals come from same-name attributes; ui-prop-* compiles caller-scope expressions. Supplying both fails.
2. Validate missing required, optional null, cloned defaults, explicit null, primitive type, finite number, array, and object values. Do not coerce strings to booleans/numbers.
3. Preserve allowed host attributes (class/style/id/role/slot/data/aria and recognized standard HTML host attributes); reject unknown nonstandard prop-like attributes. Do not interpret framework data-ui-* as arbitrary host data.
4. Create readonly props cells in component scope, with caller-side dependency subscriptions owned by the instance. Normalize/copy nested incoming values to prevent mutation escapes.
5. On valid reactive changes update props and bindings without reinitializing local state. On invalid reactive update preserve last valid prop value, diagnose PROP_TYPE, and do not remount.
6. Unsubscribe all prop expressions on disposal. Props cannot resolve caller-local variables except through their explicitly passed values.

**Acceptance:** `props.literal-string`, `props.typed-expression`, `props.both-forms`, `props.default-isolation`, `props.required`, `props.kebab`, `props.readonly-nested`, `props.invalid-update-preserves` pass.

## T050 Implement slot projection with caller scopes

**Depends on:** T012,T049. **Sources:** RFC §§4.2,11; Design §10. **Files:** `components/src/slots/{capture,assign,project}.ts`.

1. Capture host child nodes before clearing its render region; associate each with caller lexical scope and original declaration source.
2. Group element children by literal slot name and remaining nodes under default slot. Preserve source order; ignore formatting-only whitespace for unmatched-content validation.
3. Validate that each nonempty group has one matching placeholder. Multiple children may share a slot, while duplicate placeholders are invalid.
4. Replace slot placeholders with owned anchored ranges. Projected plans use caller scope; fallback plans use component scope. Dispose both through instance ownership.
5. Do not compile projected nodes twice when moving them into rendered light DOM. The transaction journal marks the movement.
6. When an instance is removed, release projected listeners/resources/refs even though lexical caller scope may remain alive. Never dispose the caller's unrelated state owner.

**Acceptance:** `slot.caller-vs-component`, `slot.named-order`, `slot.fallback`, `slot.unmatched`, `slot.duplicate-placeholder`, `slot.no-double-mount`, `slot.dispose-with-host` pass.

## T051 Implement static ID and ARIA reference rewriting

**Depends on:** T047,T050. **Sources:** RFC §11; C10. **Files:** `components/src/ids.ts`.

1. Assign each root a document-wide serial and each instance a monotonic serial. Prefix literal definition IDs with `pui-r<root>-c<instance>-`.
2. Rewrite matching literal for, aria-labelledby, aria-describedby, and aria-controls tokens that refer to IDs declared inside that same definition.
3. Preserve tokens referencing external IDs and caller-projected markup. Dynamic ui-bind-id and dynamically bound ARIA strings are authored values and are not auto-rewritten.
4. Apply rewriting to each clone before activation. Never mutate the shared definition or prefix an already cloned instance twice.
5. Detect collisions of generated IDs with existing document IDs and advance the instance serial until its full generated set is unique.
6. Validate explicit cross-component IDs passed as props in an example; do not infer them by inspecting other component internals.

**Acceptance:** `ids.two-instances`, `ids.multitoken-aria`, `ids.external-retained`, `ids.projected-unchanged`, `ids.dynamic-explicit`, `ids.generated-collision` pass with label and accessible-name assertions.

## T052 Implement instance lifecycle and custom events

**Depends on:** T017,T023,T049,T050,T051. **Sources:** RFC §§11,14. **Files:** `components/src/instance.ts`, `components/src/events.ts`.

1. Preserve the custom host and create an instance owner/component scope. Initialize copied props/defaults/local state, then render cloned light DOM through the normal compiler.
2. Instantiate nested components recursively through registry lookup. Detect infinite direct/indirect static self-instantiation with a depth limit of 128 instance ancestors and COMPONENT_RECURSION diagnostic; a finite conditional recursion still must stay within the limit.
3. Bind host ui-on custom-event handlers in caller scope; internal emit dispatches from the component host with bubbling/composed detail.
4. Validate custom event names as lowercase `[a-z][a-z0-9-]*`, excluding native/lifecycle reserved names where ambiguous. No static event declaration syntax is added; a registered component host authorizes its nonreserved custom handlers.
5. On reactive props update preserve host/local state/slot ownership. On conditional/route/removal disposal release all nested resources, projected owners, ID/ref claims, and behaviors once.
6. On import/schema failure preserve authored host fallback content and emit local diagnostics; do not mark a failed instance as successfully mounted.

**Acceptance:** `instance.local-isolation`, `instance.preserved-host`, `instance.event-caller`, `instance.nested-cleanup`, `instance.recursion`, `instance.import-fallback` pass.

## T053 Close component integration and import lifetime tests

**Depends on:** T046,T052. **Sources:** RFC §§11,18. **Files:** `tests/integration/components.spec.ts`, `evidence/components.md`.

1. Build a product-card fixture with typed object props, stateful quantity, named/default slots, local resource, caller event, and linked form labels.
2. Render 100 keyed instances, reorder, replace an item with same key, remove half, and unmount root. Check state persistence by key and zero owner/request/listener leakage.
3. Delay nested imports while toggling the containing branch and resetting the session. No disposed instance can mount after imports resolve.
4. Run identical component files in two roots with differing stores and in both build distributions. No state/registry/cache data crosses roots.
5. Verify imported styles/scripts are never installed and strict CSP reports zero violations.
6. Record source-to-fixture coverage for every component directive and all public prop/slot/error rules.

**Acceptance:** all component scenarios pass and evidence contains measured lifecycle counts, not just DOM snapshots.

## T054 Compile route patterns and destination values

**Depends on:** T004,T010,T053. **Sources:** RFC §10; C11. **Files:** `packages/router/src/{pattern,match,location}.ts`.

1. Parse route segments into literal/parameter/final-catchall records; require `/` prefix except special `*`; validate parameter identifiers and unique names.
2. Normalize trailing slash, keep root `/`, enforce final catchall, and reject malformed pattern escapes at compile time.
3. Build the left-to-right rank comparator and overlapping-pattern ambiguity validator. `/users/new` outranks `/users/:id`; `/a/:x/c` and `/a/b/:y` resolve by specificity at segment two.
4. Parse candidate location per history/hash mode; require same origin/basePath containment. Decode each path segment exactly once and reject malformed percent escapes.
5. Construct frozen route `{path,params,query,hash}`. Query duplicates become ordered arrays; path excludes basePath. Catchall decoded segments join with slash.
6. Select fallback `*` only when no ordinary route matches; require exactly one fallback and exactly one outlet in router root.

**Acceptance:** `route.literal-rank`, `route.segment-rank`, `route.ambiguous`, `route.encoded-slash`, `route.bad-encoding`, `route.catchall-empty`, `route.query-array`, `route.base-boundary`, `route.fallback` pass.

## T055 Install router and intercept eligible navigation

**Depends on:** T017,T023,T054. **Sources:** RFC §§3,10; C03,C11. **Files:** `router/src/{module,links,native-navigation}.ts`.

1. Implement installRouter(app), claim document router ownership, register route directives/navigation service, and release claim on unmount or failed boot.
2. Validate root route/outlet declarations without compiling inactive route content. Preserve shared shell and store owners outside outlet.
3. Install delegated ui-link handling inside root. Accept only unmodified primary clicks on same-origin HTTP(S) anchors within basePath without download or external target.
4. Leave hash-only same-document anchors, mailto/tel, modified clicks, middle clicks, target=_blank, and ordinary unmarked anchors to browser semantics.
5. Implement navigate(url) using router only when eligible; otherwise same-origin document navigation. Reject cross-origin command navigation as policy failure; ordinary external anchors remain browser links.
6. Parse initial document location, select route, and mount after imports/definitions are available. Document deep-link fallback requirements for history mode.

**Acceptance:** `link.eligible`, `link.modified`, `link.external-target`, `link.hash-native`, `link.unmarked`, `router.second-root`, `navigate.native-fallback`, `router.initial-deep-link` pass.

## T056 Implement guard preparation and cancellation

**Depends on:** T024,T055. **Sources:** RFC §10; Design §11. **Files:** `router/src/navigation/{prepare,guards,transaction}.ts`.

1. Allocate navigation generation and abort previous pending navigation when a new eligible request arrives; snapshot current committed route as from.
2. Parse/validate destination before executing guards. Guards see frozen from/to plus signal and run sequentially in registration order.
3. Any explicit false, thrown exception, or rejected promise cancels without disposing the current route. Only failures emit GUARD_ERROR; false is ordinary cancellation.
4. Check generation/liveness after each await. Superseded guard results must not update URL, title, focus, outlet, or store.
5. On guard acceptance create a prepared navigation transaction containing matched plan/new route scope/history intent, then hand off to commit service.
6. Unregister guards idempotently. Unmount aborts pending guards and forbids post-await navigation commits.

**Acceptance:** `guard.sync-false`, `guard.async-false`, `guard.reject`, `guard.order`, `guard.latest-wins`, `guard.unmount`, `guard.no-dom-before-commit` pass.

## T057 Implement history indexing and canceled traversal restoration

**Depends on:** T056. **Sources:** RFC §10; Design §11; C11. **Files:** `router/src/history/{state,index,traverse}.ts`.

1. Adopt initial entry with replaceState, merging `__plainui:{rootSession,index,routeKey,scroll}` into existing history.state. Preserve unrelated state fields.
2. For accepted programmatic/link navigation, save departure scroll and push exactly one indexed destination entry; same exact URL navigation is a no-op unless explicitly refreshed by resource commands.
3. Listen for popstate and hashchange as required, deduplicating the two events for one hash traversal. Set scrollRestoration=manual while router owns it and restore the previous value on unmount.
4. Run guards for traversal using the already-changed browser URL. On cancellation compute corrective delta to the last committed known index and call history.go once.
5. Suppress only the matching corrective traversal event; do not rerun guards or create entries. A newer navigation invalidates an older correction token safely.
6. For unknown/unowned history entries, perform normal document navigation without guessing index/delta. Document that the URL may temporarily reflect the attempted browser traversal while guards run, then is restored on cancellation.

**Acceptance:** `history.preserve-state`, `history.push-count`, `history.cancel-back`, `history.cancel-forward`, `history.no-guard-on-correction`, `history.rapid-traversal`, `history.unknown-entry`, `history.hash-dedup` pass in real browsers.

## T058 Commit route scopes and outlet ownership

**Depends on:** T012,T053,T057. **Sources:** RFC §10; Design §11. **Files:** `router/src/view.ts`, `router/src/navigation/commit.ts`.

1. Precompile the destination template plan before disposal when possible; malformed route declarations fail locally with fallback/error rendering rather than corrupting shell.
2. At commit recheck generation/root liveness, dispose the old route range, publish new readonly route cell, create a fresh route scope, and mount destination into the sole outlet.
3. Always create a fresh scope on parameter changes even for same route pattern. Keep root store and shared shell owners untouched.
4. Commit URL/history intent once and synchronize committed index/route identity. Failed guards never reach this stage.
5. Start new-route resources asynchronously after bindings; loading/error state does not delay committed route visibility.
6. Mark outlet replacement boundary so fragments cannot own/replace it. Route disposal releases component imports' pending instance claims, forms, behaviors, and resource subscriptions.

**Acceptance:** `route.same-pattern-new-scope`, `route.store-survives`, `route.shell-preserved`, `route.resource-not-blocking`, `route.old-request-disposed`, `route.outlet-exclusive` pass.

## T059 Implement titles, focus, scroll, and hash anchors

**Depends on:** T014,T058. **Sources:** RFC §10. **Files:** `router/src/{title,focus,scroll}.ts`.

1. Evaluate ui-title after publishing route context; require primitive/null output. Absent preserves prior title; null becomes empty string. Assign document.title as text.
2. After first route binding flush, focus first h1 inside new range; if it is not focusable temporarily add tabindex=-1. If none exists, focus outlet similarly.
3. For new navigation scroll to top; for known back/forward restore saved x/y. Hash target inside the new route takes precedence and receives scrollIntoView after mount.
4. Resolve decoded hash through getElementById scoped to current route/root without injecting a CSS selector. Do not poll indefinitely for async content; expose afterFlush in docs for app-owned delayed anchors.
5. Restore temporary tabindex when focus leaves or owner disposes. Never focus disconnected nodes or move focus because an unrelated resource refreshed.
6. Cancel pending focus/scroll postflush tasks when superseded by newer navigation. Keep shared-shell user focus stable during resource-only updates.

**Acceptance:** `route.title-expression`, `route.focus-h1`, `route.focus-outlet`, `route.scroll-top`, `route.traversal-scroll`, `route.hash-priority`, `route.no-refresh-focus`, `route.superseded-postflush` pass.

## T060 Validate hash and history mode end-to-end behavior

**Depends on:** T059. **Sources:** RFC §§10,18. **Files:** `tests/browser/router.spec.ts`, `examples/csp/router.html`, `docs/router-hosting.md`.

1. Run identical route fixtures in history and hash modes, including basePath `/app`, query arrays, inner hash anchors, fallback, Unicode, encoded slash, and malformed encoding.
2. Configure test server history fallback only for document navigations under basePath; API missing routes still return JSON 404 and asset missing routes remain 404.
3. Reload a nested route and verify selected page, title, params, and API fetches. Hash mode must work with a simple static server without history fallback.
4. Exercise unsaved form guard cancellation for link, navigate command, back, and forward; compare pre/post URL and DOM and exact history length.
5. Verify normal links with JavaScript disabled and explain that client fallback cannot manufacture a server HTTP 404 or SEO metadata.
6. Assert router listeners and modified scrollRestoration are restored on unmount.

**Acceptance:** both routing modes pass with actual navigation events and recorded host recipes; no document-global state leaks after root removal.

## T061 Close composition milestone

**Depends on:** T053,T060. **Sources:** RFC §18; Design §17. **Files:** `tests/integration/composition.spec.ts`, `evidence/milestones/M3.md`.

1. Compose imported components, caller-scoped slots, route parameters, guarded form, persisted store, and resource invalidation into a complete test shell.
2. Execute 100 transitions alternating two route patterns and changing parameters; delay responses and imports across transitions.
3. Track cleanup order, focus, history length, store survival, and owner/subscriber plateau; compare classic and ESM output.
4. Verify instance local IDs remain unique across route remounts and no retained slot references reach disposed scope state.
5. Run all component/router valid-invalid-lifecycle fixtures and strict-CSP import scenarios.
6. Store M3 evidence and carry only documented future fragment/UI work forward, not unresolved composition defects.

**Acceptance:** M3 has no failing component or navigation contract case and all lifetime counts return to baseline between routes.
