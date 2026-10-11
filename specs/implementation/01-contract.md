# PlainUI implementation contract

Read this document before implementation. Existing RFC behavior remains authoritative. **Plan decision** identifies an engineering selection made here. **Specification clarification** identifies an ambiguity that T001 must incorporate into the next RFC/design revision. Neither label implies that the supplied Word files have already been amended or accepted.

## C01 Toolchain and dependency baseline

Use TypeScript source, pnpm workspaces, esbuild for browser bundles, `tsc` for types, Vitest for pure unit tests, Playwright for browser conformance, fast-check for property tests, parse5 for CLI HTML parsing, DOMPurify for browser fragment sanitization, and axe-core through its Playwright integration for automated accessibility checks. No framework or DOM emulator is required by the browser runtime.

Pin direct versions exactly, without `^`, `~`, or `latest`. The initial versions came from npm registry metadata read during planning; T002 added the tested Vite peer pin. Commit the full dependency graph through `pnpm-lock.yaml`. T002 verifies the combination with an install and compatibility smoke test before other work starts.

| Tool | Exact version |
|---|---|
| Node.js | 24.21.0 |
| pnpm | 12.10.1 |
| TypeScript | 7.0.2 |
| esbuild | 0.28.2 |
| Vitest | 5.0.3 |
| Vite (Vitest runner peer) | 7.3.7 |
| @playwright/test | 1.64.0 |
| fast-check | 4.10.2 |
| parse5 | 8.0.1 |
| dompurify | 3.4.16 |
| @axe-core/playwright | 4.13.0 |
| @noble/hashes | 2.4.0 |
| chart.js (example only) | 4.5.1 |
| codemirror (example only) | 6.0.2 |
| @codemirror/state (example only) | 6.7.6 |
| busboy (Node example server only) | 1.6.0 |
| Python (example server only) | 3.13.7 |
| python-multipart (Python example server only) | 0.0.32 |

Node 24 is selected as the LTS implementation environment, according to the [Node release schedule](https://github.com/nodejs/Release) and [Node releases](https://github.com/nodejs/node/releases). Initial package versions were recorded from their official npm registry `/<package>/latest` metadata on 10 October 2026. T002 added an exact Vite 7.3.7 peer pin after the unbounded Vitest peer resolved to Vite 8.3.4 and its Rolldown native binding was absent from the pnpm 12.10.1 Windows install. The pinned Vite 7.3.7/Vitest 5.0.3 combination passed the T002 unit smoke test. Archive exact-version metadata in T002. Upgrade a pin only in a dedicated dependency change with lockfile, security review, conformance run, and size comparison. Do not let a later `latest` silently change this baseline.

DOMPurify is the selected maintained sanitizer. Its [official documentation](https://github.com/cure53/DOMPurify) describes DOM-fragment output and Trusted Types integration. The PlainUI allowlist and trust policy remain narrower than the sanitizer defaults. Playwright's WebKit builds do not substitute for actual Safari release qualification; [Playwright documents this limitation](https://playwright.dev/docs/browsers).

Use ES2022 browser output with DOM/DOM.Iterable typings. Test against the RFC release browser matrix; do not promise that the syntax target alone proves compatibility. Ship no polyfill bundle by default. The CLI runs on Node 24 or a later supported even-numbered LTS that passes the CLI suite. Applications consuming static assets require neither Node nor TypeScript.

## C02 Repository and package layout

Create these source areas. Internal packages are private workspace units, not independently versioned public contracts.

```text
packages/
  schema/src/             directive, option, diagnostic, allowlist definitions
  core/src/               app, owner, scope, json, expression, scheduler, compiler,
                          bindings, structure, commands, diagnostics, public-api
  data/src/               request, policy, transport, adapter, coordinator,
                          cache, resource, action, session
  forms/src/              model, validation, serialize, reset, errors, pending
  components/src/         registry, imports, props, slots, ids, instance
  router/src/             module, pattern, location, navigation, history, view
  fragments/src/          module, sanitize, policy, candidate, target, swap
  ui/src/                module, dialog, toast, tabs
  styles/src/plainui.css
  runtime/src/            classic, esm, official-module bridge
  tooling/src/            cli, validate, build, html-adapter, diagnostics
tests/
  unit/ conformance/ browser/ security/ integration/ fixtures/ support/
examples/
  blog/ storefront/ saas/ extension-chart/ extension-editor/ csp/
  backends/node/ backends/python/ contracts/
benchmarks/ scripts/ docs/ evidence/ dist/
```

Public package working names are `plainui` and `@plainui/cli`; registry availability is checked in T098. If unavailable, release is blocked until an explicitly recorded publishing identity is supplied, not silently renamed by an implementer. Bundle core, data, forms, and components together. Router, fragments, UI, and CSS remain separate. Optional modules import only a versioned internal module bridge, never private implementation files from one another. Enforce import boundaries in T003.

Publish `plainui.js`, `plainui.mjs`, `plainui-router.js/.mjs`, `plainui-fragments.js/.mjs`, `plainui-ui.js/.mjs`, `plainui.css`, `.d.ts`, source maps, schema JSON, licenses, and integrity manifest. No full bundle is required; do not spend time on an additional convenience bundle for 1.0.

## C03 Public startup and official module installation

**Specification clarification:** asynchronous imports require a ready signal, while the RFC says mount returns an App. Keep mount synchronous in return type and add `app.ready: Promise<void>`. `PlainUI.mount(root, options)` returns the new App immediately. `app.mount(root)` returns that same App. `ready` resolves after first successful bindings, handler activation, eligible request scheduling, and cloak removal; it does not await network resource data. Root-fatal failures reject `ready`; local failures emit diagnostics and allow ready to resolve.

Use lifecycle states `created → compiling → mounted → unmounting → unmounted`, plus `failed` for a root-fatal boot failure. Registration is permitted only in `created`. `unmount()` is synchronous and idempotent; it aborts pending boot/import work and all owned operations. An unmounted App is terminal; create a new App to mount again. Calling mount again on the same active App and same root returns it; another App attempting that root fails. Multiple copies of the distribution use one document-local symbol marker to detect duplicate roots without sharing application state.

Programmatic mount requires a connected Element from the target document. If it has no ui-app/data-ui-app name, assign an internal unique `app-<documentSerial>` name without adding an auto-mount directive. Explicit root names are still recommended for stable persistence namespaces. A named root's name must be nonempty after trimming; retain its exact trimmed case. The uniqueness/nested-root checks apply equally to programmatic and classic mounting. DocumentFragments and disconnected elements are rejected with ROOT_INVALID.

**Plan decision:** ESM official modules export `installRouter(app)`, `installFragments(app)`, and `installUI(app)`, each returning the same App. They invoke the official module bridge and must run before `app.mount`. This adds no JSON configuration keys. Typical use:

```js
import { PlainUI } from './plainui.mjs';
import { installRouter } from './plainui-router.mjs';
const app = PlainUI.create({ router: { mode: 'history', basePath: '/' } });
installRouter(app);
app.mount(document.querySelector('[ui-app]'));
await app.ready;
```

Classic optional scripts register installers on `window.PlainUI` before deferred DOM-ready boot begins; load core first, then optional scripts, all with `defer`. The queue contains installers only, never root contexts. A new App snapshots installed classic modules. Missing/late modules diagnose and do not patch an already mounted root. Duplicate installation of the identical official module is a no-op; differing versions fail. Require the same full runtime version for official modules.

**Specification clarification:** add `app.onDiagnostic(listener): () => void` and `app.inspect(): InspectorSnapshot` to expose the diagnostics/inspector required by RFC §14. Inspection throws `INSPECTOR_DISABLED` unless `debug=true`. Diagnostics can be subscribed before mount; they are redacted even when subscribed. No raw-body or secret opt-out is offered in 1.0.

`get`, `set`, `batch`, `refresh`, `resetSession`, `unmount`, register methods, and `beforeNavigate` retain the RFC semantics. `set` returns void. `batch` returns the synchronous callback result. `refresh` returns `Promise<JsonValue>` for the next accepted value and rejects with a normalized failure or AbortError. `beforeNavigate` returns an unregister callback and requires the router. Registration calls return the App for chaining.

## C04 Shared records and interfaces

Use JSON primitives `null | boolean | string | finite number`, arrays of JSON, and own string-keyed JSON records. Internal records are null-prototype dictionaries. Public snapshots are detached, deeply frozen JSON values. Normalize `undefined` to null at JS boundaries; reject cycles, BigInt, functions, symbol values, Date/Map/Set/class instances, accessors, and forbidden keys. Repeated references without a cycle are copied per occurrence. Do not invoke input getters while normalizing.

```ts
type OwnerKind = 'root'|'element'|'state'|'conditional'|'loop'|'loop-item'|
  'component'|'slot'|'route'|'fragment'|'behavior';
type Owner = {
  id: number; parent: Owner|null; kind: OwnerKind; active: boolean;
  children: Set<Owner>; controller: AbortController;
  disposers: Array<() => void>; range?: DomRange;
};
type Scope = {
  id: number; parent: Scope|null; owner: Owner; active: boolean;
  kind: 'app'|'local'|'loop'|'component'|'route';
  bindings: Map<string, Cell>; refs: Map<string, Element>;
};
type Cell = {
  value: JsonValue; version: number; writable: boolean;
  source: 'state'|'store'|'derived'|'resource'|'action'|'props'|'route'|'alias';
};
type DomRange = { start: Comment; end: Comment; owner: Owner };
type EvalResult = { ok: true; value: JsonValue } |
  { ok: false; code: string; span: {start: number; end: number} };
```

The real implementation may split storage for memory efficiency, but must preserve these semantics. Lexical `Scope.parent` and lifecycle `Owner.parent` are separate links. Slotted content is the principal reason they cannot be inferred from DOM ancestry.

Scope API: `get(path)`, `set(path,value)`, `batch(fn)`, `refresh(name)`, `refs.get(name)`, `emit(name,detail)`, `afterFlush(fn)`, and `signal`. `afterFlush` returns a cancellation function. Every entry point checks liveness. Command context adds `host`, the safe event snapshot, and `canceled` for lifecycle finalization. Behavior factory signature is `(element, options, scopeApi, signal) => void | (() => void)`; async factory results are invalid. Command signature is `(context, ...args) => unknown | Promise<unknown>`; outputs are not implicitly assigned to state.

Adapter shape is `{version: string, prepare?, success?, error?}`; the identity adapter is version `1`. `prepare` returns a complete normalized draft or undefined to retain the draft. It may modify URL, headers, credentials, and body; it may not change method or response mode. All modifications pass final policy validation. `success` returns JSON; `error` returns the normalized error shape. Hooks receive scope/root abort context as appropriate but never raw executable HTML. Response metadata includes status, statusText, URL, and a read-only map of browser-exposed headers excluding Set-Cookie.

## C05 Grammar details and expression failures

Precedence from tightest to loosest: member/index and permitted named formatter call; unary `! -`; `* / %`; `+ -`; `< <= > >=`; `=== !==`; `&&`; `||`; `??`; ternary. Binary operators associate left; ternary associates right. Require parentheses when a coalescing node shares an unparenthesized chain with either boolean operator. Short circuit `&&`, `||`, `??`, and ternary; return selected operands using the RFC truthiness rule.

**Plan decision:** numbers accept `digits[.digits][e[+-]digits]` and `.digits[e[+-]digits]`; a unary minus supplies the sign. Disallow hex, octal, binary, numeric separators, Infinity, NaN, and a trailing decimal point. Strings support JSON escapes plus escaped single quote in single-quoted strings. Disallow raw newlines and unknown escapes. Arrays/objects/calls allow no trailing commas. Object keys must be quoted string literals. Duplicate object keys fail. Whitespace is ASCII space/tab/CR/LF; comments are not part of the language.

The source budget is UTF-8 bytes. AST depth counts expression nodes, including a member chain, from root depth 1. Each AST evaluation and property read consumes one step. The budget is shared across all argument evaluations in one handler invocation; async wait does not replenish it. Formatter CPU time is trusted extension behavior and cannot be bounded by AST steps.

**Specification clarification:** ordinary type failures produce null for a rendering expression and diagnose. A resource/request/command argument evaluation that has any type failure aborts that effect, even if the expression later coalesces null. Limit failures preserve the last valid binding/derived output and do not execute effects. Use an out-of-band failure flag rather than treating every error as an ordinary null. Missing data and null property reads are not failures. Compare strings with strings or finite numbers with numbers for ordering; mixed types and nonprimitive ordering fail. Equality follows the RFC and never coerces.

Writable paths contain a declared identifier or `store`, followed by dot identifiers or bracket string/integer literals. Dynamic computed write paths are excluded; use a registered command for computed edits. The top binding must be writable. Existing intermediate objects/arrays are required; do not invent containers. New object leaf keys are permitted; array writes replace an existing index only, and array growth uses array replacement. `length`, negative indices, and all forbidden keys are unwritable. `set(count, count+1)` remains valid. JS `app.set` and `get` parse the same path subset; `get` permits read-only names.

## C06 Scope, scheduling, and ownership

Reserved names are exactly `store`, `route`, `props`, `$event`, `$action`, `$result`, `$error`. State names, derived names, resource names, action names, and loop aliases share the declaration namespace. Refs have a separate namespace. Forbid pollution keys at every object/path depth. Component scopes have no caller-local lexical parent; provide explicit app store/route access. Slots retain caller scope while being disposed by the component slot owner.

Each root flush has queues in this order: derived, structure, bindings, accessibility, afterFlush. Coalesce duplicate jobs by identity within a pass; stable creation order breaks ties. Recheck liveness before every job. Writes during any phase invalidate dependencies and create the next pass. Stop the root at the attempt to start pass 101; keep disposal and diagnostics working after `UPDATE_LOOP`. A new root or other existing roots continue.

Disposal order: mark owner/subtree inactive; abort signals and release pending work; recursively dispose child owners; run own cleanup callbacks once in reverse registration order; remove owned DOM; remove index/registry entries. Catch individual cleanup failures and continue. A cleanup may inspect its still-connected host but cannot write state after inactive. An explicit removal transaction may defer node removal until all cleanup callbacks complete.

Generated operations enter a framework transaction. Do not assume a boolean flag survives until MutationObserver delivery. Record expected added/removed nodes in a WeakMap transaction journal and reconcile actual final connectivity when observer batches arrive. Only complete anchored ranges may move as preserved units. Across-scope moves dispose and remount from the captured declarative source; moving one anchor without its range is `OWNER_RANGE` and tears down the broken owner.

## C07 Configuration and persistence

Validate the exact fields and defaults in RFC §3.1. Merge nested objects field-by-field in order defaults → config block → programmatic options. Merge api.headers case-insensitively. Endpoint headers override application headers, including null as removal. Unknown keys at every nesting level fail root configuration. Validate a BCP 47 locale using Intl canonicalization and an IANA zone using Intl.DateTimeFormat. `api.baseUrl` must resolve to HTTP(S); normalize allowedOrigins to unique URL origins and disallow paths/userinfo there. Default origin/base comes from the document, not global location in another window.

Storage key is `plainui:<encodedRootName>:v<version>:<encodedExplicitKey>`; URI-encode the two names. Stored envelope is `{version, value}`. A state/store declaration that contains both on one element cannot use one ambiguous ui-persist; reject this combination and require separate owners. Persistence key uniqueness is checked across mounted roots for the same origin/name/version. Restore before derived evaluation; invalid envelope/value restores the declaration defaults. Persist only the declaration's keys, not lexical descendants or resources. Flush one write per changed persisted declaration after a successful reactive pass. `resetSession` does not erase local/store/persisted state.

## C08 HTTP identity and cancellation

Cache identity consists of root identity, authentication epoch, adapter name/version, method, canonical final URL, credentials, and effective normalized headers. Canonical URL uses the URL serializer, strips the fragment, and preserves query pair order and repeated-value order; do not sort semantically meaningful query values. Lowercase header names, sort names, normalize browser-style whitespace, and hash the full header sequence using SHA-256. Hash with Web Crypto in secure contexts; use the pinned @noble/hashes SHA-256 implementation as the bundled non-secure HTTP fallback. Both paths must produce identical bytes for the standard SHA-256 vectors. Raw effective headers exist only in request memory and never in diagnostic keys.

**Plan decision:** reusable cache identity excludes timeout/retry/freshness, as the RFC specifies. In-flight identity additionally includes timeout, retry count, response mode, and per-key invalidation generation. This prevents subscribers with incompatible attempt policies from accidentally sharing a transport. Only GET requests with identical flight identity share. GET actions may share a compatible JSON transport with resources; they still maintain independent action lifecycle records and do not automatically consume settled resource cache. HTML actions use target-specific flights and do not share transports.

Maintain separate `authEpoch`, consumer `generation`, and cache-key `invalidationGeneration`. Every await boundary validates all applicable tokens and owner liveness. The request attempt timeout covers fetch plus body reading. Each asynchronous adapter hook has a separate deadline equal to the resolved request timeout, starting at hook invocation, including prepare before a flight key exists. Exceeding a hook deadline is kind=adapter, code=ADAPTER_TIMEOUT; it never retries automatically. Release that hook's timer on completion or cancellation, and ignore late results. Retry only transport network/timeout/502/503/504, only GET, exactly 500/1000/2000 ms with no jitter; no retry for adapter exceptions, parse, policy, or validation errors. This hook deadline is a plan-selected clarification to prevent permanently pending adapter promises.

`cache.maxEntries=0` disables settled cache but still allows flight sharing. One successful response can populate cache when at least one attached resource has positive TTL; all consumers evaluate freshness against the same acceptedAt using their own TTL. Cache holds no per-entry authoritative `expiresAt`: that Design field is optional derived metadata, not a replacement for subscriber TTL. `ui-cache=0` means stale immediately after successful settlement; data remains usable in the controller and no endless automatic refresh is scheduled. Schedule stale transitions at the next relevant TTL boundary for positive TTLs without automatically fetching solely because time passed.

**Specification clarification:** ordinary refresh invalidates only if no current revalidation already represents the key's latest invalidation generation; concurrent refresh calls join that revalidation. A new mutation invalidation always advances the generation, invalidates an older flight, and schedules active automatic consumers. Invalidation must notify all consumers of the resolved key, not only the named declaration. Manual and not-yet-visible resources remain unfetched but stale. `refresh` on manual/hidden resources is an explicit fetch request and does run. Incomplete URL data clears the old key and returns idle, including for an explicitly requested refresh (reject with RESOURCE_SUSPENDED rather than waiting forever).

For incomplete manual resources, dependency changes still clear old-key values; manual disables initiating network, not identity safety. Session reset advances epoch first, aborts active operations, clears caches and records to idle, and does not automatically refetch until a subsequent explicit refresh or eligible dependency transition. This avoids refetching with old credentials during logout.

## C09 Action and lifecycle rules

Evaluate debounce on raw eligible events before allocating an operation. At dispatch, native validation is synchronous and input/request preparation captures a snapshot. A pending trailing debounce retains the newest snapshot. When its timer fires, run one operation. `drop` ignores additional triggers while an operation is pending; `replace` cancels the pending operation when the new debounced operation actually starts. `pending` begins at operation start, not while waiting for debounce.

An enhanced form listener prevents navigation once native validation passes and it has accepted the event for enhancement. Synchronous body/URL preparation errors then settle locally as errors without sending or replaying a native submit. Compile-invalid forms never attach enhancement and keep fallback behavior. Invalid native controls send nothing and do not set pending.

Set pending=false and settle the record; schedule invalidations; flush relevant DOM/accessibility; run success or error; then run finally in a protected `finally` block. A command error stops only its handler and still allows request-finally. Cancellation restores the last settled record for the current generation and runs finally only while owner is live. A replaced operation may run its own finally with canceled=true but may not overwrite the newer operation's record or disabled tokens. Disposal never invokes more user handlers. `$result` is accepted action/resource data on success and null otherwise; `$error` is normalized failure on error and null otherwise. Both exist only in lifecycle scopes.

Prevent server-success + downstream-fragment-failure confusion: an HTML action is successful only after candidate commit succeeds. A JSON action success remains success when subsequent commands or invalidation GETs fail. Do not automatically retry a mutation whose outcome is unknown.

## C10 Components and template clarifications

Prop schema permits only `type`, `required`, `default`; reject unknown keys and `required:true` combined with a default. Validate defaults at definition compile time. Optional missing props are null even when their declared type is non-null. Passing null explicitly is allowed only for optional props. Unknown nonstandard instance attributes are errors, except standard host attributes permitted by RFC §11 and recognized framework directives. Literal boolean presence does not mean true; booleans require ui-prop expressions.

**Specification clarification:** `ui-state` on a component definition initializes the instance component scope directly. Declaration templates inside an instance belong to that scope unless an explicit nested state owner intervenes. Duplicate slot placeholders fail, while multiple caller children with the same `slot` value are projected together in source order. Default slot receives text nodes and unassigned elements; ignore formatting-only whitespace when diagnosing unmatched slots. Keep the host element; it is not recreated on reactive prop updates.

Imports resolve relative to the importing file URL; top-level imports resolve against document URL. This refines the design's general document-relative statement so nested component trees can be relocated. Imports use same-origin GET, redirect:error, credentials:same-origin, app timeout, and text/html validation. They do not use api.baseUrl, resource caches, request adapters, or CSRF. Strip URL fragments for import identity. Resolve canonical URL cycles before fetching again.

Static ID rewriting prefixes only literal template IDs and matching tokens. Dynamic bound IDs are authored explicitly and not prefixed. For labels and ARIA, rewrite only tokens that match an ID declared within the same definition; retain explicit external references. Generate prefixes from a document-wide root serial and monotonically increasing instance serial, never user values.

## C11 Router decisions

Only one root per document may install an active router because browser history/scroll belong to the document. Other non-router roots remain allowed. Reject a second router root with ROUTER_DOCUMENT_OWNER. Routes use a literal route template containing either ordinary markup or a registered component host; no new route-import syntax is introduced. `ui-route="*"` is the only special fallback. `ui-title` is an expression; a static title must be quoted inside the attribute.

Compare matching candidates by segment specificity from left to right (literal=3, parameter=2, catchall=1), then exact-end over empty catchall. Do not rank total literal count ahead of the first differing segment. Detect ambiguous equal-specificity overlapping patterns at compile time. Catchall can capture zero segments; its decoded value joins segment values with `/`. Duplicate parameter names fail. Decode each segment once; `%2F` inside a segment stays one matched segment with `/` in its parameter value. Reject malformed encoding before guards.

History mode uses document pathname/query/hash. Hash mode uses `#/path?query#anchor` inside the browser hash, with route.hash from the inner anchor. The configured basePath is normalized to one leading slash and no trailing slash except `/`; its containment check requires a segment boundary. Hash mode basePath is applied to the inner route path. Query repeated keys become ordered arrays; `?q` is an empty string. Normal ui-link hash-only anchors in the current document are not intercepted.

Guards run sequentially in registration order and get frozen `from`, `to`, and a navigation signal. Only explicit false cancels; thrown/rejected values cancel and diagnose. The last navigation wins. Namespace history metadata under `__plainui` while preserving other state keys. Track known index/destination pairs and restore canceled traversal with `history.go(previousIndex - attemptedIndex)` and one correction token. Unknown history is handed back to normal document navigation, never an invented index.

## C12 Fragment policy and transactional ownership

Use the exact RFC §12 tag and attribute lists, stored as schema data. Default content is untrusted and cannot contain any ui/data-ui directives, component enhancement, SVG, MathML, scripts, styles, frames, executable URLs, or form destination outside the current origin. Developer enhanced content requires both action ui-enhance=true and root fragments.enhance=true. Sanitizer removal of ordinary unsafe markup is expected sanitation, not automatically an action failure. Explicitly forbidden enhanced root/declaration directives, malformed remaining directives, invalid ownership, and failed candidate compilation are policy/validation failures and preserve existing DOM.

HTML action success commits `data=null`, and its success handler receives `$result=null`; raw response HTML is never installed in JSON state. Adapter prepare still runs for an HTML action. JSON success-normalization hooks do not process HTML; the fragment service is its success processor. An HTTP failure may supply safely parsed JSON to adapter.error when the response is actually JSON, but never passes executable HTML. Fragment authorization/ownership policy failures normalize to kind=security/code=FRAGMENT_POLICY; remaining structural candidate failures use kind=validation/code=FRAGMENT_POLICY; unexpected activation failure uses kind=validation/code=FRAGMENT_ACTIVATION.

**Specification clarification:** the enhanced directive allowlist is exact: ui-state; ui-derived/ui-value; ui-text/ui-bind-*/ui-src/ui-href/ui-class/ui-show; ui-model/ui-field-error; ui-if/ui-else-if/ui-else/ui-for/ui-key; ui-data plus standard request/action options; ui-on:*; ui-ref/ui-ignore/ui-cloak; ui-prop-*; ui-use/ui-options. Exclude persistence, router directives, root config/store, component definitions/imports, and ui-toasts. Template nodes are permitted for allowed structural, derived, and resource declarations in enhanced mode, resolving the RFC phrase “structural directives” against its request/state requirements. This clarification must be recorded before production fragment implementation.

**Specification clarification:** outer swaps in untrusted mode use a sidecar target-ref assignment after sanitation. Do not preserve arbitrary ui-ref from response markup. Require exactly one surviving replacement element, internally transfer the original target's ref name, and register that ref without compiling other directives. In enhanced mode require the explicit same ui-ref. This preserves RFC outer-target identity without allowing untrusted directives to execute.

Target arbitration is keyed by target owner, not initiating action. Advance generation at accepted trigger time, before asynchronous preparation. Validate target again at commit. before/after insertion ranges are children of the destination's parent owner with an additional lifetime link to the destination; append/prepend ranges are target children. Disposing either required lifetime owner releases the inserted range once. inner disposes child owners only, preserves target scope/ref/host behaviors, and removes destination-linked inserted children; outer disposes the target and all its linked ranges. Never operate inside ui-ignore or replace a root, outlet, component host, active loop item/range, or action ancestor.

Trusted Types: use a private DOMPurify instance and its documented `dompurify` policy, allowed explicitly by CSP. Accept DOM-fragment output and insert nodes using DOM APIs; never serialize sanitized nodes back into innerHTML. Keep raw parsing/HTML sinks inside the HTML service. Developer-owned component imports also use the shared inert HTML service under strict CSP, with an import grammar validator, rather than introducing an unguarded DOMParser sink in core. This service provides a core-safe static-template parsing path; the optional sanitizer is not pulled into the core bundle. T007 must prove this split under enforced Trusted Types and record policy names (`plainui-template` for developer templates and `dompurify` for fragments). Policies are private and expose no public raw-to-TrustedHTML helper. Source trust and parser validation remain necessary; Trusted Types alone is not sanitization.

## C13 UI defaults and CSS values

Tabs ui-options schema: `{activation:'manual'|'automatic', orientation:'horizontal'|'vertical'}` with defaults manual/horizontal; unknown keys fail for the tabs behavior. Disabled tabs are skipped. Horizontal arrows honor computed direction; vertical tabs use Up/Down. Home/End go to first/last enabled. A removed active tab activates the next enabled tab, else the previous, else hides all panels. Dialogs require nonempty aria-label or an aria-labelledby chain resolving to nonempty text. Missing names diagnose and do not open.

`toast(message)` accepts a primitive rendered as text; null is empty text and does not enqueue. Default lifetime is 5000 ms, maximum 5 visible items, FIFO eviction, each with a native dismiss button. Pause expiry while hovered or focus is inside; resume with remaining time. Region options may declare `{toastDurationMs:0}` for persistent notifications; use this only on the ui-toasts owner with ui-options and no ui-use, clarified in T001. Create one polite status region per root when none is provided. Do not use assertive alerts for routine toasts.

CSS tokens: background `#ffffff`, text `#18212f`, primary `#1d4ed8`, danger `#b91c1c`; spaces 1–6 are `.25rem`, `.5rem`, `.75rem`, `1rem`, `1.5rem`, `2rem`; radius `.375rem`; font `system-ui, sans-serif`. Use border-box, visible `:focus-visible` outlines, `[hidden]{display:none!important}`, logical spacing, fluid controls, and no essential animation. ui-container uses max-inline-size `72rem`, centered margins, padding-inline `1rem`; ui-stack is vertical flex gap `var(--ui-space-4)`; ui-cluster wraps with gap `var(--ui-space-3)`; ui-grid uses auto-fit columns `minmax(min(100%,16rem),1fr)` and gap `var(--ui-space-4)`.

## C14 Errors, diagnostics, and release evidence

Normalized request errors contain exactly `{kind,status,code,message,fields,retryable,requestId}` as specified. Cancellation is an AbortError internally, never a new resource error. Diagnostics carry stable code, severity, rootId, ownerId, directive, structural location, and safe message; debug adds source spans with values redacted and import pathname without query. Use numeric generated IDs in messages; never stringify arbitrary user data for logging.

Every invariant in this contract receives a fixture ID in T004/T005 and a row in coverage. Release evidence must distinguish “automated engine test passed” from “actual released browser tested,” and “axe scan passed” from “manual assistive review completed.” Gate failures remain failures; no default waiver mechanism is built into the release script.
