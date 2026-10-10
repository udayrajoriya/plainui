# PlainUI revision 0.2 proposed amendment set

10 October 2026 · Status Proposed · Acceptance pending

This is the complete proposed revision 0.2 amendment set for RFC 0001 and its companion Technical Design. The immutable revision 0.1 Markdown transcriptions remain the base text. The rules below supplement their identified clauses and replace any specifically conflicting wording only after explicit acceptance. Unaffected revision 0.1 wording remains unchanged.

**No acceptance is recorded.** The source DOCX files and their Proposed status are preserved. Implementation may follow this proposed baseline under the plan, while the 1.0 release gate still requires acceptance of the revision and its recorded impact. The reference to revision 0.2 names this draft; it is not a claim that the source documents have been revised.

## Source documents

- [RFC revision 0.1](PlainUI-1.0-RFC-revision-0.1.md)
- [Technical Design revision 0.1](PlainUI-1.0-Technical-Design-revision-0.1.md)
- [Decision record 0001](../decisions/0001-baseline.md)
- [Structured amendment inventory](revision-0.2-amendments.json)

## Applying and accepting this revision

1. Review each A001–A014 clause block and S001–S018 supplement. The complete normative selections are present below; the inventory includes source clauses and exact content digests.
2. Record accepted/rejected/amended status for each item and the corresponding final wording. An amendment changes the draft and its inventory together; a rejection requires updating affected plan tasks and fixtures before implementation changes course.
3. Once all items have a disposition, record the accepting project owner, acceptance date, accepted document hash, and resulting revision identity. Until then acceptedBy and acceptedAt stay null.
4. Merge accepted public rules into their identified RFC sections, matching Design changes, directive schema and conformance fixtures. Engineering selections remain decisions, not application requirements.
5. Keep original revision 0.1 sources and their hashes intact. Release qualification references the accepted revision as well as the source baseline.

## Amendment clauses

### A001 Toolchain and dependency baseline

**Plan decision:** C01. **Affected source clauses:** RFC §§2–3,18; Design §§2,12,16.

**Scope:** engineering selection; CLI/runtime delivery requirements. **Status:** proposed.

Use TypeScript source, pnpm workspaces, esbuild for browser bundles, `tsc` for types, Vitest for pure unit tests, Playwright for browser conformance, fast-check for property tests, parse5 for CLI HTML parsing, DOMPurify for browser fragment sanitization, and axe-core through its Playwright integration for automated accessibility checks. No framework or DOM emulator is required by the browser runtime.

Pin direct versions exactly, without `^`, `~`, or `latest`. The npm registry metadata read during planning returned the following versions. Commit the full dependency graph through `pnpm-lock.yaml`; an install/compatibility smoke test in T002 verifies this combination before other work starts. These are package selections, not a claim that their combination has already been tested.

| Tool | Initial exact version |
|---|---|
| Node.js | 24.21.0 |
| pnpm | 12.10.1 |
| TypeScript | 7.0.2 |
| esbuild | 0.28.2 |
| Vitest | 5.0.3 |
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

Node 24 is selected as the LTS implementation environment, according to the [Node release schedule](https://github.com/nodejs/Release) and [Node releases](https://github.com/nodejs/node/releases). Package versions are recorded from their official npm registry `/<package>/latest` metadata on 10 October 2026. Archive that metadata in T002. Upgrade a pin only in a dedicated dependency change with lockfile, security review, conformance run, and size comparison. Do not let a later `latest` silently change this baseline.

DOMPurify is the selected maintained sanitizer. Its [official documentation](https://github.com/cure53/DOMPurify) describes DOM-fragment output and Trusted Types integration. The PlainUI allowlist and trust policy remain narrower than the sanitizer defaults. Playwright's WebKit builds do not substitute for actual Safari release qualification; [Playwright documents this limitation](https://playwright.dev/docs/browsers).

Use ES2022 browser output with DOM/DOM.Iterable typings. Test against the RFC release browser matrix; do not promise that the syntax target alone proves compatibility. Ship no polyfill bundle by default. The CLI runs on Node 24 or a later supported even-numbered LTS that passes the CLI suite. Applications consuming static assets require neither Node nor TypeScript.

### A002 Repository and package layout

**Plan decision:** C02. **Affected source clauses:** RFC §§2.1,3,14; Design §2.

**Scope:** engineering selection; distribution contract. **Status:** proposed.

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

### A003 Public startup and official module installation

**Plan decision:** C03. **Affected source clauses:** RFC §§3,14; Design §§4,14.

**Scope:** public additions and lifecycle clarification. **Status:** proposed.

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

### A004 Shared records and interfaces

**Plan decision:** C04. **Affected source clauses:** RFC §§4.1–4.2,5,14–15; Design §§3,5–6,14.

**Scope:** internal records plus public normalization/API clarification. **Status:** proposed.

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

### A005 Grammar details and expression failures

**Plan decision:** C05. **Affected source clauses:** RFC §§4.1–4.3,5,8.1; Design §5.

**Scope:** public grammar and error semantics. **Status:** proposed.

Precedence from tightest to loosest: member/index and permitted named formatter call; unary `! -`; `* / %`; `+ -`; `< <= > >=`; `=== !==`; `&&`; `||`; `??`; ternary. Binary operators associate left; ternary associates right. Require parentheses when a coalescing node shares an unparenthesized chain with either boolean operator. Short circuit `&&`, `||`, `??`, and ternary; return selected operands using the RFC truthiness rule.

**Plan decision:** numbers accept `digits[.digits][e[+-]digits]` and `.digits[e[+-]digits]`; a unary minus supplies the sign. Disallow hex, octal, binary, numeric separators, Infinity, NaN, and a trailing decimal point. Strings support JSON escapes plus escaped single quote in single-quoted strings. Disallow raw newlines and unknown escapes. Arrays/objects/calls allow no trailing commas. Object keys must be quoted string literals. Duplicate object keys fail. Whitespace is ASCII space/tab/CR/LF; comments are not part of the language.

The source budget is UTF-8 bytes. AST depth counts expression nodes, including a member chain, from root depth 1. Each AST evaluation and property read consumes one step. The budget is shared across all argument evaluations in one handler invocation; async wait does not replenish it. Formatter CPU time is trusted extension behavior and cannot be bounded by AST steps.

**Specification clarification:** ordinary type failures produce null for a rendering expression and diagnose. A resource/request/command argument evaluation that has any type failure aborts that effect, even if the expression later coalesces null. Limit failures preserve the last valid binding/derived output and do not execute effects. Use an out-of-band failure flag rather than treating every error as an ordinary null. Missing data and null property reads are not failures. Compare strings with strings or finite numbers with numbers for ordering; mixed types and nonprimitive ordering fail. Equality follows the RFC and never coerces.

Writable paths contain a declared identifier or `store`, followed by dot identifiers or bracket string/integer literals. Dynamic computed write paths are excluded; use a registered command for computed edits. The top binding must be writable. Existing intermediate objects/arrays are required; do not invent containers. New object leaf keys are permitted; array writes replace an existing index only, and array growth uses array replacement. `length`, negative indices, and all forbidden keys are unwritable. `set(count, count+1)` remains valid. JS `app.set` and `get` parse the same path subset; `get` permits read-only names.

### A006 Scope, scheduling, and ownership

**Plan decision:** C06. **Affected source clauses:** RFC §§4.2–6,14–15; Design §§3–4,6–7.

**Scope:** internal algorithms plus observable disposal/flush semantics. **Status:** proposed.

Reserved names are exactly `store`, `route`, `props`, `$event`, `$action`, `$result`, `$error`. State names, derived names, resource names, action names, and loop aliases share the declaration namespace. Refs have a separate namespace. Forbid pollution keys at every object/path depth. Component scopes have no caller-local lexical parent; provide explicit app store/route access. Slots retain caller scope while being disposed by the component slot owner.

Each root flush has queues in this order: derived, structure, bindings, accessibility, afterFlush. Coalesce duplicate jobs by identity within a pass; stable creation order breaks ties. Recheck liveness before every job. Writes during any phase invalidate dependencies and create the next pass. Stop the root at the attempt to start pass 101; keep disposal and diagnostics working after `UPDATE_LOOP`. A new root or other existing roots continue.

Disposal order: mark owner/subtree inactive; abort signals and release pending work; recursively dispose child owners; run own cleanup callbacks once in reverse registration order; remove owned DOM; remove index/registry entries. Catch individual cleanup failures and continue. A cleanup may inspect its still-connected host but cannot write state after inactive. An explicit removal transaction may defer node removal until all cleanup callbacks complete.

Generated operations enter a framework transaction. Do not assume a boolean flag survives until MutationObserver delivery. Record expected added/removed nodes in a WeakMap transaction journal and reconcile actual final connectivity when observer batches arrive. Only complete anchored ranges may move as preserved units. Across-scope moves dispose and remount from the captured declarative source; moving one anchor without its range is `OWNER_RANGE` and tears down the broken owner.

### A007 Configuration and persistence

**Plan decision:** C07. **Affected source clauses:** RFC §§3.1,5; Design §6.

**Scope:** public configuration and persistence clarification. **Status:** proposed.

Validate the exact fields and defaults in RFC §3.1. Merge nested objects field-by-field in order defaults → config block → programmatic options. Merge api.headers case-insensitively. Endpoint headers override application headers, including null as removal. Unknown keys at every nesting level fail root configuration. Validate a BCP 47 locale using Intl canonicalization and an IANA zone using Intl.DateTimeFormat. `api.baseUrl` must resolve to HTTP(S); normalize allowedOrigins to unique URL origins and disallow paths/userinfo there. Default origin/base comes from the document, not global location in another window.

Storage key is `plainui:<encodedRootName>:v<version>:<encodedExplicitKey>`; URI-encode the two names. Stored envelope is `{version, value}`. A state/store declaration that contains both on one element cannot use one ambiguous ui-persist; reject this combination and require separate owners. Persistence key uniqueness is checked across mounted roots for the same origin/name/version. Restore before derived evaluation; invalid envelope/value restores the declaration defaults. Persist only the declaration's keys, not lexical descendants or resources. Flush one write per changed persisted declaration after a successful reactive pass. `resetSession` does not erase local/store/persisted state.

### A008 HTTP identity and cancellation

**Plan decision:** C08. **Affected source clauses:** RFC §§7–8,14–15; Design §8.

**Scope:** public HTTP/cache/cancellation clarification. **Status:** proposed.

Cache identity consists of root identity, authentication epoch, adapter name/version, method, canonical final URL, credentials, and effective normalized headers. Canonical URL uses the URL serializer, strips the fragment, and preserves query pair order and repeated-value order; do not sort semantically meaningful query values. Lowercase header names, sort names, normalize browser-style whitespace, and hash the full header sequence using SHA-256. Hash with Web Crypto in secure contexts; use the pinned @noble/hashes SHA-256 implementation as the bundled non-secure HTTP fallback. Both paths must produce identical bytes for the standard SHA-256 vectors. Raw effective headers exist only in request memory and never in diagnostic keys.

**Plan decision:** reusable cache identity excludes timeout/retry/freshness, as the RFC specifies. In-flight identity additionally includes timeout, retry count, response mode, and per-key invalidation generation. This prevents subscribers with incompatible attempt policies from accidentally sharing a transport. Only GET requests with identical flight identity share. GET actions may share a compatible JSON transport with resources; they still maintain independent action lifecycle records and do not automatically consume settled resource cache. HTML actions use target-specific flights and do not share transports.

Maintain separate `authEpoch`, consumer `generation`, and cache-key `invalidationGeneration`. Every await boundary validates all applicable tokens and owner liveness. The request attempt timeout covers fetch plus body reading. Each asynchronous adapter hook has a separate deadline equal to the resolved request timeout, starting at hook invocation, including prepare before a flight key exists. Exceeding a hook deadline is kind=adapter, code=ADAPTER_TIMEOUT; it never retries automatically. Release that hook's timer on completion or cancellation, and ignore late results. Retry only transport network/timeout/502/503/504, only GET, exactly 500/1000/2000 ms with no jitter; no retry for adapter exceptions, parse, policy, or validation errors. This hook deadline is a plan-selected clarification to prevent permanently pending adapter promises.

`cache.maxEntries=0` disables settled cache but still allows flight sharing. One successful response can populate cache when at least one attached resource has positive TTL; all consumers evaluate freshness against the same acceptedAt using their own TTL. Cache holds no per-entry authoritative `expiresAt`: that Design field is optional derived metadata, not a replacement for subscriber TTL. `ui-cache=0` means stale immediately after successful settlement; data remains usable in the controller and no endless automatic refresh is scheduled. Schedule stale transitions at the next relevant TTL boundary for positive TTLs without automatically fetching solely because time passed.

**Specification clarification:** ordinary refresh invalidates only if no current revalidation already represents the key's latest invalidation generation; concurrent refresh calls join that revalidation. A new mutation invalidation always advances the generation, invalidates an older flight, and schedules active automatic consumers. Invalidation must notify all consumers of the resolved key, not only the named declaration. Manual and not-yet-visible resources remain unfetched but stale. `refresh` on manual/hidden resources is an explicit fetch request and does run. Incomplete URL data clears the old key and returns idle, including for an explicitly requested refresh (reject with RESOURCE_SUSPENDED rather than waiting forever).

For incomplete manual resources, dependency changes still clear old-key values; manual disables initiating network, not identity safety. Session reset advances epoch first, aborts active operations, clears caches and records to idle, and does not automatically refetch until a subsequent explicit refresh or eligible dependency transition. This avoids refetching with old credentials during logout.

### A009 Action and lifecycle rules

**Plan decision:** C09. **Affected source clauses:** RFC §§8–9; Design §9.

**Scope:** public action and lifecycle clarification. **Status:** proposed.

Evaluate debounce on raw eligible events before allocating an operation. At dispatch, native validation is synchronous and input/request preparation captures a snapshot. A pending trailing debounce retains the newest snapshot. When its timer fires, run one operation. `drop` ignores additional triggers while an operation is pending; `replace` cancels the pending operation when the new debounced operation actually starts. `pending` begins at operation start, not while waiting for debounce.

An enhanced form listener prevents navigation once native validation passes and it has accepted the event for enhancement. Synchronous body/URL preparation errors then settle locally as errors without sending or replaying a native submit. Compile-invalid forms never attach enhancement and keep fallback behavior. Invalid native controls send nothing and do not set pending.

Set pending=false and settle the record; schedule invalidations; flush relevant DOM/accessibility; run success or error; then run finally in a protected `finally` block. A command error stops only its handler and still allows request-finally. Cancellation restores the last settled record for the current generation and runs finally only while owner is live. A replaced operation may run its own finally with canceled=true but may not overwrite the newer operation's record or disabled tokens. Disposal never invokes more user handlers. `$result` is accepted action/resource data on success and null otherwise; `$error` is normalized failure on error and null otherwise. Both exist only in lifecycle scopes.

Prevent server-success + downstream-fragment-failure confusion: an HTML action is successful only after candidate commit succeeds. A JSON action success remains success when subsequent commands or invalidation GETs fail. Do not automatically retry a mutation whose outcome is unknown.

### A010 Components and template clarifications

**Plan decision:** C10. **Affected source clauses:** RFC §§4.2,11; Design §10.

**Scope:** public component clarification. **Status:** proposed.

Prop schema permits only `type`, `required`, `default`; reject unknown keys and `required:true` combined with a default. Validate defaults at definition compile time. Optional missing props are null even when their declared type is non-null. Passing null explicitly is allowed only for optional props. Unknown nonstandard instance attributes are errors, except standard host attributes permitted by RFC §11 and recognized framework directives. Literal boolean presence does not mean true; booleans require ui-prop expressions.

**Specification clarification:** `ui-state` on a component definition initializes the instance component scope directly. Declaration templates inside an instance belong to that scope unless an explicit nested state owner intervenes. Duplicate slot placeholders fail, while multiple caller children with the same `slot` value are projected together in source order. Default slot receives text nodes and unassigned elements; ignore formatting-only whitespace when diagnosing unmatched slots. Keep the host element; it is not recreated on reactive prop updates.

Imports resolve relative to the importing file URL; top-level imports resolve against document URL. This refines the design's general document-relative statement so nested component trees can be relocated. Imports use same-origin GET, redirect:error, credentials:same-origin, app timeout, and text/html validation. They do not use api.baseUrl, resource caches, request adapters, or CSRF. Strip URL fragments for import identity. Resolve canonical URL cycles before fetching again.

Static ID rewriting prefixes only literal template IDs and matching tokens. Dynamic bound IDs are authored explicitly and not prefixed. For labels and ARIA, rewrite only tokens that match an ID declared within the same definition; retain explicit external references. Generate prefixes from a document-wide root serial and monotonically increasing instance serial, never user values.

### A011 Router decisions

**Plan decision:** C11. **Affected source clauses:** RFC §10; Design §11.

**Scope:** public navigation clarification and design conflict resolution. **Status:** proposed.

Only one root per document may install an active router because browser history/scroll belong to the document. Other non-router roots remain allowed. Reject a second router root with ROUTER_DOCUMENT_OWNER. Routes use a literal route template containing either ordinary markup or a registered component host; no new route-import syntax is introduced. `ui-route="*"` is the only special fallback. `ui-title` is an expression; a static title must be quoted inside the attribute.

Compare matching candidates by segment specificity from left to right (literal=3, parameter=2, catchall=1), then exact-end over empty catchall. Do not rank total literal count ahead of the first differing segment. Detect ambiguous equal-specificity overlapping patterns at compile time. Catchall can capture zero segments; its decoded value joins segment values with `/`. Duplicate parameter names fail. Decode each segment once; `%2F` inside a segment stays one matched segment with `/` in its parameter value. Reject malformed encoding before guards.

History mode uses document pathname/query/hash. Hash mode uses `#/path?query#anchor` inside the browser hash, with route.hash from the inner anchor. The configured basePath is normalized to one leading slash and no trailing slash except `/`; its containment check requires a segment boundary. Hash mode basePath is applied to the inner route path. Query repeated keys become ordered arrays; `?q` is an empty string. Normal ui-link hash-only anchors in the current document are not intercepted.

Guards run sequentially in registration order and get frozen `from`, `to`, and a navigation signal. Only explicit false cancels; thrown/rejected values cancel and diagnose. The last navigation wins. Namespace history metadata under `__plainui` while preserving other state keys. Track known index/destination pairs and restore canceled traversal with `history.go(previousIndex - attemptedIndex)` and one correction token. Unknown history is handed back to normal document navigation, never an invented index.

### A012 Fragment policy and transactional ownership

**Plan decision:** C12. **Affected source clauses:** RFC §§8,12,15–16; Design §12.

**Scope:** public fragment/security clarification. **Status:** proposed.

Use the exact RFC §12 tag and attribute lists, stored as schema data. Default content is untrusted and cannot contain any ui/data-ui directives, component enhancement, SVG, MathML, scripts, styles, frames, executable URLs, or form destination outside the current origin. Developer enhanced content requires both action ui-enhance=true and root fragments.enhance=true. Sanitizer removal of ordinary unsafe markup is expected sanitation, not automatically an action failure. Explicitly forbidden enhanced root/declaration directives, malformed remaining directives, invalid ownership, and failed candidate compilation are policy/validation failures and preserve existing DOM.

HTML action success commits `data=null`, and its success handler receives `$result=null`; raw response HTML is never installed in JSON state. Adapter prepare still runs for an HTML action. JSON success-normalization hooks do not process HTML; the fragment service is its success processor. An HTTP failure may supply safely parsed JSON to adapter.error when the response is actually JSON, but never passes executable HTML. Fragment authorization/ownership policy failures normalize to kind=security/code=FRAGMENT_POLICY; remaining structural candidate failures use kind=validation/code=FRAGMENT_POLICY; unexpected activation failure uses kind=validation/code=FRAGMENT_ACTIVATION.

**Specification clarification:** the enhanced directive allowlist is exact: ui-state; ui-derived/ui-value; ui-text/ui-bind-*/ui-src/ui-href/ui-class/ui-show; ui-model/ui-field-error; ui-if/ui-else-if/ui-else/ui-for/ui-key; ui-data plus standard request/action options; ui-on:*; ui-ref/ui-ignore/ui-cloak; ui-prop-*; ui-use/ui-options. Exclude persistence, router directives, root config/store, component definitions/imports, and ui-toasts. Template nodes are permitted for allowed structural, derived, and resource declarations in enhanced mode, resolving the RFC phrase “structural directives” against its request/state requirements. This clarification must be recorded before production fragment implementation.

**Specification clarification:** outer swaps in untrusted mode use a sidecar target-ref assignment after sanitation. Do not preserve arbitrary ui-ref from response markup. Require exactly one surviving replacement element, internally transfer the original target's ref name, and register that ref without compiling other directives. In enhanced mode require the explicit same ui-ref. This preserves RFC outer-target identity without allowing untrusted directives to execute.

Target arbitration is keyed by target owner, not initiating action. Advance generation at accepted trigger time, before asynchronous preparation. Validate target again at commit. before/after insertion ranges are children of the destination's parent owner with an additional lifetime link to the destination; append/prepend ranges are target children. Disposing either required lifetime owner releases the inserted range once. inner disposes child owners only, preserves target scope/ref/host behaviors, and removes destination-linked inserted children; outer disposes the target and all its linked ranges. Never operate inside ui-ignore or replace a root, outlet, component host, active loop item/range, or action ancestor.

Trusted Types: use a private DOMPurify instance and its documented `dompurify` policy, allowed explicitly by CSP. Accept DOM-fragment output and insert nodes using DOM APIs; never serialize sanitized nodes back into innerHTML. Keep raw parsing/HTML sinks inside the HTML service. Developer-owned component imports also use the shared inert HTML service under strict CSP, with an import grammar validator, rather than introducing an unguarded DOMParser sink in core. This service provides a core-safe static-template parsing path; the optional sanitizer is not pulled into the core bundle. T007 must prove this split under enforced Trusted Types and record policy names (`plainui-template` for developer templates and `dompurify` for fragments). Policies are private and expose no public raw-to-TrustedHTML helper. Source trust and parser validation remain necessary; Trusted Types alone is not sanitization.

### A013 UI defaults and CSS values

**Plan decision:** C13. **Affected source clauses:** RFC §13,16.4; Design §13.

**Scope:** public UI/defaults clarification. **Status:** proposed.

Tabs ui-options schema: `{activation:'manual'|'automatic', orientation:'horizontal'|'vertical'}` with defaults manual/horizontal; unknown keys fail for the tabs behavior. Disabled tabs are skipped. Horizontal arrows honor computed direction; vertical tabs use Up/Down. Home/End go to first/last enabled. A removed active tab activates the next enabled tab, else the previous, else hides all panels. Dialogs require nonempty aria-label or an aria-labelledby chain resolving to nonempty text. Missing names diagnose and do not open.

`toast(message)` accepts a primitive rendered as text; null is empty text and does not enqueue. Default lifetime is 5000 ms, maximum 5 visible items, FIFO eviction, each with a native dismiss button. Pause expiry while hovered or focus is inside; resume with remaining time. Region options may declare `{toastDurationMs:0}` for persistent notifications; use this only on the ui-toasts owner with ui-options and no ui-use, clarified in T001. Create one polite status region per root when none is provided. Do not use assertive alerts for routine toasts.

CSS tokens: background `#ffffff`, text `#18212f`, primary `#1d4ed8`, danger `#b91c1c`; spaces 1–6 are `.25rem`, `.5rem`, `.75rem`, `1rem`, `1.5rem`, `2rem`; radius `.375rem`; font `system-ui, sans-serif`. Use border-box, visible `:focus-visible` outlines, `[hidden]{display:none!important}`, logical spacing, fluid controls, and no essential animation. ui-container uses max-inline-size `72rem`, centered margins, padding-inline `1rem`; ui-stack is vertical flex gap `var(--ui-space-4)`; ui-cluster wraps with gap `var(--ui-space-3)`; ui-grid uses auto-fit columns `minmax(min(100%,16rem),1fr)` and gap `var(--ui-space-4)`.

### A014 Errors, diagnostics, and release evidence

**Plan decision:** C14. **Affected source clauses:** RFC §§9,14–15,18; Design §§14–16.

**Scope:** public errors/diagnostics and evidence rules. **Status:** proposed.

Normalized request errors contain exactly `{kind,status,code,message,fields,retryable,requestId}` as specified. Cancellation is an AbortError internally, never a new resource error. Diagnostics carry stable code, severity, rootId, ownerId, directive, structural location, and safe message; debug adds source spans with values redacted and import pathname without query. Use numeric generated IDs in messages; never stringify arbitrary user data for logging.

Every invariant in this contract receives a fixture ID in T004/T005 and a row in coverage. Release evidence must distinguish “automated engine test passed” from “actual released browser tested,” and “axe scan passed” from “manual assistive review completed.” Gate failures remain failures; no default waiver mechanism is built into the release script.

## Supplemental behavior clauses

These clauses cover observable choices made in detailed tasks and schema data in addition to C01–C14. They retain the selected plan text and do not assert that fixtures already exist.

### S001 Safe JSON ingestion and snapshots

**Plan source:** `specs/implementation/02-foundation.md` T008, steps 1, 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §§4.1,5,14–15; Design §5. **Status:** proposed.

1. Normalize JSON with iterative traversal to avoid stack overflow on deeply nested input data. Track active ancestry for cycle detection, not a global seen set that rejects harmless repeated references.

2. Read property descriptors before values; reject getters/setters, symbols, class prototypes, sparse-array holes normalized to null only at explicit JS boundary, and prohibited keys at every depth.

3. Normalize undefined to null, reject nonfinite numbers, and use null-prototype internal object records.

4. Parse the path subset in C05 with source spans. Distinguish literal array index from object property. Reject forbidden keys before lookup.

5. Implement immutable path replacement, missing-intermediate errors, bounds checks, and root-cell writability checks. Return changed path prefixes for invalidation.

6. Expose detached frozen snapshots; never return internal mutable state from public get or props.

### S002 Registry and lexical reference boundaries

**Plan source:** `specs/implementation/02-foundation.md` T011, steps 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §§4.2,14. **Status:** proposed.

2. Reject duplicates across all declaration kinds and reserved names. Allow shadowing in child scopes; do not permit same-scope duplicates.

3. Implement refs as lexical names with one live element per name per scope; never return refs as expression values.

4. Build immutable command/formatter/behavior/adapter registries with identifier validation, duplicate/built-in rejection, and adapter version metadata. Freeze at compilation start.

5. Supply component isolation boundaries and context cells for store, route, props, and lifecycle/event values without making them writable.

6. Implement app-scope versus lexical-scope API resolution explicitly; app.refresh cannot reach an arbitrary local resource.

### S003 Persistence restoration shape and storage failures

**Plan source:** `specs/implementation/02-foundation.md` T015, steps 1, 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §5; Design §6. **Status:** proposed.

1. Compile persistence only on an unambiguous state/store declaration with explicit nonempty key and valid session/local enum.

2. Claim the namespaced key, read the selected Storage object inside try/catch, and validate the envelope/version/value before first derived evaluation.

3. Restore the whole declared object only when it has the same declared top-level keys; wrong/missing/extra keys restore defaults and diagnose. Type evolution is application-managed through namespace version.

4. Coalesce changed declaration snapshots into one JSON serialization/storage write after each settled flush. Do not serialize resources/props/refs or descendants.

5. Storage denial/quota/JSON failures produce nonfatal diagnostics while live state stays committed. Release key claims on disposal.

6. Document and test that session reset does not clear persistence, and no storage-event synchronization exists.

### S004 Command grammar, modifiers, and event snapshot ordering

**Plan source:** `specs/implementation/02-foundation.md` T022, steps 1, 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §8.1. **Status:** proposed.

1. Parse semicolon-separated exact-name calls with optional final semicolon; reject empty interior commands, arbitrary statements, and nested effect calls in expression arguments.

2. Compile set/toggle first arguments as writable paths; all other arguments are pure expression ASTs. Share invocation budget across arguments.

3. Validate DOM event names and `.prevent/.stop/.once/.self`; reject duplicates, unknown modifiers, modifiers on lifecycle handlers, and collision with declarative request trigger.

4. Snapshot only type/key/button/value/checked/detail. Normalize component detail with safe JSON; omit live Event/target/DOM references. Expose null for inapplicable fields.

5. Apply self filtering before prevent/stop/once consumption; prevent/stop occur synchronously during native dispatch. Command execution then awaits sequentially.

6. Register listeners through owner disposal. Once removes the listener on the first eligible event even if the handler later fails.

### S005 Core commands and post-await liveness

**Plan source:** `specs/implementation/02-foundation.md` T023, steps 1, 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §§8.1,14. **Status:** proposed.

1. Implement set and toggle as immediate state writes; wrong boolean/path or expression failure stops the handler before further effects.

2. Implement emit with bubbling/composed CustomEvent from the current host and safely normalized detail; forbid reserved request lifecycle event names as component emissions.

3. Implement focus by lexical ref lookup, wait for flush, require a connected focusable target, and cancel if owner is disposed while waiting.

4. Route refresh/reset/navigate/open/close/toast through registered service interfaces. Missing optional UI/router services produce MODULE_MISSING where required; navigate has native same-origin fallback when router is absent.

5. Invoke custom commands with scoped API/signal/host/refs/event snapshot; await promises sequentially, catch failures, diagnose COMMAND_ERROR, and stop only that handler.

6. Check liveness before invocation and after each await; refuse postdisposal writes through retained context APIs. Do not roll back completed earlier commands.

### S006 Response decoding, empty body, opaque response, and correlation bounds

**Plan source:** `specs/implementation/03-data-and-forms.md` T029, steps 1, 2, 3, 4, 5, 6, 7.
**Affected source clauses:** RFC §§7–8,15. **Status:** proposed.

1. Call browser Fetch with the immutable draft, redirect:'error', credentials, and a linked AbortController. Reject opaque/opaqueredirect responses as security failures.

2. Keep one attempt deadline covering fetch and body consumption; clear it before invoking response adapters, which use their separate C08 hook deadline. Distinguish transport timeout abort from caller/owner cancellation with an explicit reason token.

3. Read successful/failed body once as text. Treat 204 or zero-length 2xx text as null. Whitespace-only JSON text is nonempty and must parse successfully or fail.

4. For nonempty JSON success require media type application/json or `application/*+json`, ignoring parameters/case; parse with JSON.parse then safe-normalize. Wrong media type is parse-kind RESPONSE_TYPE; malformed JSON is parse-kind RESPONSE_PARSE.

5. HTTP non-2xx never becomes success. Parse JSON error bodies only when JSON media type and valid syntax; otherwise supply null parsed body to error hook with safe default HTTP message. Do not render raw error HTML/text.

6. HTML response mode delegates sanitized handling to fragments after text/html validation; no JSON resource receives HTML. Capture correlation header `x-request-id` only as bounded text (maximum 256 characters), never as executable markup.

7. Always clear deadline and abort listeners in finally, including decoding/adapter exceptions.

### S007 Action option placement and context

**Plan source:** `specs/implementation/03-data-and-forms.md` T036, steps 1, 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §§8,16.3–16.4. **Status:** proposed.

1. Distinguish resource template from action by ui-data. For action require one method, validate method-specific options, and select submit/change/click default trigger.

2. Resolve ui-trigger only from supported DOM events; reject duplicate request and ui-on same-trigger binding on that element.

3. Create optional named read-only action cell in nearest lexical scope plus `$action` context for action element descendants. Initialize pending=false,status=idle,data=null,error=null.

4. Compile URL/query/headers/body once into AST plans; do not send anything during compilation. Register no listener if the action configuration is statically invalid.

5. Validate form encoding/defaults and lifecycle handlers before activation; delegate forms to T042–T045.

6. HTML action options require fragments module/target/swap and cannot appear on a resource. JSON actions reject target/swap/enhance options.

### S008 Control adapter switching and invalid numeric input

**Plan source:** `specs/implementation/03-data-and-forms.md` T039, steps 1, 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §9. **Status:** proposed.

1. Validate writable path, supported control type, and conflicting bind sinks. Reject file inputs and non-controls for ui-model.

2. Text/textarea controls use input; maintain per-control composition flag, suppress writes from compositionstart through intermediate input, and commit once at compositionend.

3. Number/range use valueAsNumber and raw empty detection; empty→null, finite valid→number, invalid text→retain model and set a framework-owned validity message. Clearing/reentering valid text clears only that message.

4. Initial state writes to controls after persistence; later model updates change DOM only when normalized values differ. Preserve selection/caret and active IME text.

5. Do not dispatch synthetic input/change from programmatic updates. Register native listeners and validity cleanup with owner.

6. Type-changing bound input attributes must reselect the supported adapter safely; changes to/from file type are diagnosed and model binding disabled for that control.

### S009 Radio and select model edge cases

**Plan source:** `specs/implementation/03-data-and-forms.md` T040, steps 1, 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §9. **Status:** proposed.

1. Checkbox model requires boolean and uses checked on change. Reject array-checkbox-model conventions; they are not in this RFC.

2. Radio groups bind strings and synchronize by name/form ownership plus bound path; only checked radio change writes value. Diagnose inconsistent paths within the same modeled group.

3. Single select binds the selected string; multiple select binds selected option strings in DOM order, including no selection as empty array.

4. Model updates check matching radio/options and never synthesize events. Unmatched radio string unchecks the group; unmatched single-select string sets selectedIndex=-1.

5. On dynamic option/control addition run normal binding synchronization; removal releases registrations. Preserve static labels and native disabled semantics.

6. Record form-owned model paths for T043 reset snapshots once controls have initial normalized values.

### S010 Reset cancellation and snapshot boundaries

**Plan source:** `specs/implementation/03-data-and-forms.md` T043, steps 1, 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §9. **Status:** proposed.

1. After state/persistence/initial models resolve, capture immutable values for each distinct model path in the form. Deduplicate shared radio paths and overlapping parent/child paths deterministically by keeping the broadest captured path once.

2. Register snapshots by form owner/ref. Newly mounted modeled controls capture their path at their own initial mount if the form has no existing snapshot for it.

3. reset(ref) resolves a form lexically, invokes native reset, then batches restoration of captured paths and clears field errors/owned validity state.

4. Honor a canceled native reset event by not restoring models/errors. Observe ordinary reset buttons and programmatic form.reset() through the same handler without recursion.

5. Native file reset remains browser-owned. Do not refetch resources or reset unrelated state/action success data.

6. Dispose snapshots when the form owner is removed; remounted forms capture new defaults.

### S011 Static ID rewriting boundaries and collision recovery

**Plan source:** `specs/implementation/04-composition.md` T051, steps 1, 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §11. **Status:** proposed.

1. Assign each root a document-wide serial and each instance a monotonic serial. Prefix literal definition IDs with `pui-r<root>-c<instance>-`.

2. Rewrite matching literal for, aria-labelledby, aria-describedby, and aria-controls tokens that refer to IDs declared inside that same definition.

3. Preserve tokens referencing external IDs and caller-projected markup. Dynamic ui-bind-id and dynamically bound ARIA strings are authored values and are not auto-rewritten.

4. Apply rewriting to each clone before activation. Never mutate the shared definition or prefix an already cloned instance twice.

5. Detect collisions of generated IDs with existing document IDs and advance the instance serial until its full generated set is unique.

6. Validate explicit cross-component IDs passed as props in an example; do not infer them by inspecting other component internals.

### S012 Component event names and recursion limit

**Plan source:** `specs/implementation/04-composition.md` T052, steps 1, 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §§11,14. **Status:** proposed.

1. Preserve the custom host and create an instance owner/component scope. Initialize copied props/defaults/local state, then render cloned light DOM through the normal compiler.

2. Instantiate nested components recursively through registry lookup. Detect infinite direct/indirect static self-instantiation with a depth limit of 128 instance ancestors and COMPONENT_RECURSION diagnostic; a finite conditional recursion still must stay within the limit.

3. Bind host ui-on custom-event handlers in caller scope; internal emit dispatches from the component host with bubbling/composed detail.

4. Validate custom event names as lowercase `[a-z][a-z0-9-]*`, excluding native/lifecycle reserved names where ambiguous. No static event declaration syntax is added; a registered component host authorizes its nonreserved custom handlers.

5. On reactive props update preserve host/local state/slot ownership. On conditional/route/removal disposal release all nested resources, projected owners, ID/ref claims, and behaviors once.

6. On import/schema failure preserve authored host fallback content and emit local diagnostics; do not mark a failed instance as successfully mounted.

### S013 History ownership, unchanged URL, and correction behavior

**Plan source:** `specs/implementation/04-composition.md` T057, steps 1, 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §10; Design §11. **Status:** proposed.

1. Adopt initial entry with replaceState, merging `__plainui:{rootSession,index,routeKey,scroll}` into existing history.state. Preserve unrelated state fields.

2. For accepted programmatic/link navigation, save departure scroll and push exactly one indexed destination entry; same exact URL navigation is a no-op unless explicitly refreshed by resource commands.

3. Listen for popstate and hashchange as required, deduplicating the two events for one hash traversal. Set scrollRestoration=manual while router owns it and restore the previous value on unmount.

4. Run guards for traversal using the already-changed browser URL. On cancellation compute corrective delta to the last committed known index and call history.go once.

5. Suppress only the matching corrective traversal event; do not rerun guards or create entries. A newer navigation invalidates an older correction token safely.

6. For unknown/unowned history entries, perform normal document navigation without guessing index/delta. Document that the URL may temporarily reflect the attempted browser traversal while guards run, then is restored on cancellation.

### S014 Route title null values and temporary focusability

**Plan source:** `specs/implementation/04-composition.md` T059, steps 1, 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §10. **Status:** proposed.

1. Evaluate ui-title after publishing route context; require primitive/null output. Absent preserves prior title; null becomes empty string. Assign document.title as text.

2. After first route binding flush, focus first h1 inside new range; if it is not focusable temporarily add tabindex=-1. If none exists, focus outlet similarly.

3. For new navigation scroll to top; for known back/forward restore saved x/y. Hash target inside the new route takes precedence and receives scrollIntoView after mount.

4. Resolve decoded hash through getElementById scoped to current route/root without injecting a CSS selector. Do not poll indefinitely for async content; expose afterFlush in docs for app-owned delayed anchors.

5. Restore temporary tabindex when focus leaves or owner disposes. Never focus disconnected nodes or move focus because an unrelated resource refreshed.

6. Cancel pending focus/scroll postflush tasks when superseded by newer navigation. Keep shared-shell user focus stable during resource-only updates.

### S015 Behavior setup order, return contract, and failure cleanup

**Plan source:** `specs/implementation/05-fragments-and-ui.md` T069, steps 1, 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §14. **Status:** proposed.

1. Parse ui-use as ordered space-separated unique names; reject duplicate/unknown names. ui-options is a safe JSON object, not expression text.

2. Invoke factories in declaration order with element, frozen copied options, scoped API, and owner signal, after initial bindings and before eligible network starts.

3. Require optional cleanup function return; reject promises/nonfunction nonundefined returns. If a later factory fails, clean up already-started factories in reverse order and mark that behavior owner failed.

4. Provide afterFlush cancellation, scoped refs/emit/state/refresh, and lifecycle checks. Trusted factory code may retain non-JSON widget objects privately.

5. Enforce documented inner ui-ignore boundary for widgets owning descendants; PlainUI may remove the whole host but never traverse the widget subtree.

6. Cleanup runs once with host still connected, after scope is inactive. Leaked postdispose writes diagnose and are rejected.

### S016 Dialog cancellation and focus return

**Plan source:** `specs/implementation/05-fragments-and-ui.md` T070, steps 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §13. **Status:** proposed.

2. open(ref) requires a connected native HTMLDialogElement in lexical root, usable showModal, and C13 accessible name; unknown/wrong targets fail locally.

3. Capture connected opener from activeElement, call showModal, rely on native focus containment/Escape semantics, and track open state per dialog.

4. close(ref) calls native close only when open and restores focus to connected focusable opener after close; a removed opener produces no focus attempt.

5. Handle native close/cancel events consistently. Respect author-canceled cancel events; do not forcibly close a prevented Escape action.

6. Disposal closes/releases controller listeners and focus references without running commands into dead scopes.

### S017 Tabs selection and dynamic removal behavior

**Plan source:** `specs/implementation/05-fragments-and-ui.md` T072, steps 1, 2, 3, 4, 5, 6.
**Affected source clauses:** RFC §13. **Status:** proposed.

1. Validate one descendant tablist, tab elements, corresponding unique tabpanel IDs, aria-controls/labelledby relationships, and no ownership crossing into nested tabs widgets.

2. Validate options; choose first enabled aria-selected=true tab or first enabled tab. Reject multiple initially selected tabs with a diagnostic and use the first in DOM order deterministically.

3. Apply roving tabindex (focused enabled tab=0, others=-1), aria-selected on active tab, and hidden on inactive panels without removing labels.

4. Handle horizontal Left/Right honoring RTL; vertical Up/Down; Home/End; Enter/Space activation in manual mode. Automatic option activates with focus. Prevent default only for handled keys.

5. Skip disabled/aria-disabled tabs. Click activates an eligible native tab control; never convert generic markup into unnamed interactive controls.

6. Observe owned tab additions/removal through lifecycle hooks; active removal uses C13 next/previous fallback. Cleanup restores framework-owned ARIA/tabindex/hidden values and removes listeners.

### S018 Schema allowlists, suffixes, integers, enums, and diagnostic assignments

**Plan source:** `specs/implementation/09-schema-details.md`.
**Affected source clauses:** RFC §§4,9,12–16; Design §§12,14. **Status:** proposed.

## Exact binding allowlist

Ordinary permitted names are:

```text
id title value checked disabled required readonly multiple selected hidden open
name placeholder min max step pattern type href src alt width height colspan
rowspan role tabindex
```

Permit `aria-<suffix>` and `data-<suffix>` with a nonempty lowercase attribute suffix matching `[a-z0-9_.:-]+`, excluding all `data-ui-*`. Exclude empty suffix, on*, srcdoc, style, innerHTML, outerHTML, and unlisted attributes. Dynamic family syntax is normalized after the HTML parser lowercases attribute names; JavaScript API names remain case-sensitive.

Presence-style boolean attribute names in this allowlist are checked, disabled, required, readonly, multiple, selected, hidden, open. checked uses the property and presence semantics appropriate to the input, with binding updates controlling the current property. value uses current property. readonly maps to readOnly property when property access is required. Other numeric-looking attributes are string attributes with browser-native interpretation; the runtime does not invent range validation for width/height/colspan.

`ui-bind-class` is not allowed; use ui-class. `ui-bind-style` is not allowed. `ui-src` and `ui-bind-src` on the same element conflict even though they are spelled differently; same for href. ui-model conflicts with either value or checked ownership, and ui-show conflicts with hidden ownership. No two directive plans may own the same sink.

URL sink policy after trimming leading/trailing ASCII whitespace and resolving with URL:

| Sink | Accepted destinations |
|---|---|
| Request URL | HTTP/HTTPS, no userinfo, allowedOrigins, no followed redirects |
| Navigation command | Same-origin HTTP/HTTPS, router eligible when inside basePath |
| Bound/fragment href | HTTP/HTTPS, mailto, tel, same-document hash; never javascript/data/blob/file |
| Bound/fragment src | HTTP/HTTPS only; same-origin not required for images |
| Fragment form action | Same-origin HTTP/HTTPS only |
| Component import | Same-origin HTTP/HTTPS only; redirect rejected |

Reject ASCII control characters embedded in a URL string before normalization, including tabs/CR/LF that URL parsing could otherwise discard. Network origin policy uses the final normalized URL.origin after adapters. Invalid dynamic URL bindings remove the sink; invalid requests transmit nothing; invalid fragment URL attributes are removed by sanitation. Use URL_POLICY for sink errors and REQUEST_ORIGIN for request destination denial.

## Exact fragment tag allowlist

```text
a abbr article aside b blockquote br button caption code col colgroup dd details
dialog div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6
header hr i img input label legend li main nav ol optgroup option p pre section
select small span strong sub summary sup table tbody td textarea th thead time
tr ul
```

Unsupported ordinary tags are unwrapped while preserving already-sanitized descendants. Drop the whole subtree for script, style, iframe, object, embed, svg, and math. Remove base and metadata links rather than installing document metadata. Do not allow head/body/html nodes to escape inert parsing into the live document. Template is an enhanced-only allowance for the allowed structural, derived, and resource declarations in C12. Registered component tags are enhanced-only; arbitrary custom elements are not allowed.

## Exact fragment attribute allowlist

```text
id class title lang dir role href target rel src alt width height name value
type disabled required readonly multiple checked selected placeholder min max
step pattern for action method enctype colspan rowspan scope datetime open
hidden tabindex slot
```

Also permit reviewed aria-* and ordinary data-* according to the binding suffix rules, except framework data-ui-*. Always strip on*, srcdoc, style, formaction, formtarget. target `_blank` adds both noopener and noreferrer; `_self` is allowed; all other target values are removed. UI directive trust is not granted by an ordinary data prefix or by same-origin delivery.

Enhanced mode additionally permits exactly these canonical directives and their data aliases:

```text
ui-state ui-derived ui-value ui-text ui-bind-* ui-src ui-href ui-class ui-show
ui-model ui-field-error ui-if ui-else-if ui-else ui-for ui-key ui-data
ui-get ui-post ui-put ui-patch ui-delete ui-load ui-query ui-headers ui-body
ui-adapter ui-credentials ui-timeout ui-cache ui-retry ui-action ui-trigger
ui-concurrency ui-debounce ui-invalidate ui-on:* ui-encoding ui-response
ui-target ui-swap ui-enhance ui-ref ui-ignore ui-cloak ui-prop-* ui-use ui-options
```

Every preserved directive still passes its normal placement/value/conflict checks. Forbid ui-app, ui-config, ui-store, ui-persist, ui-persist-key, ui-route, ui-outlet, ui-link, ui-title, ui-component, ui-props, ui-import, ui-toasts. `ui-props` is a definition schema, not an instance prop binding. A registered component host may retain only declared literal prop attributes plus ordinary safe host attributes and allowed ui-prop bindings.

## Event and enum tables

Supported native declarative events: click, input, change, submit, keydown, keyup, focus, blur. Request lifecycle names: success, error, finally. DOM modifiers: prevent, stop, once, self. Component custom names follow C10/T052 rules; no general arbitrary DOM event registration directive is added.

Enum values are lowercase and exact:

| Setting | Values | Default |
|---|---|---|
| ui-persist | session, local | absent |
| ui-load | auto, manual, visible | auto |
| credentials | omit, same-origin, include | same-origin |
| ui-concurrency | drop, replace | drop |
| ui-encoding | json, form, multipart | json; GET must explicitly be form |
| ui-response | json, html | json |
| ui-swap | inner, outer, before, after, append, prepend | inner |
| ui-enhance | true, false | false |
| router.mode | history, hash | history |
| tabs activation | manual, automatic | manual |
| tabs orientation | horizontal, vertical | horizontal |

Integer attributes use decimal digit strings only, no signs/exponents/hex/decimal points. ui-timeout>=1, ui-cache>=0, ui-debounce>=0, ui-retry in0..3. Reject values exceeding Number.MAX_SAFE_INTEGER before timers/cache arithmetic. The configuration JSON equivalents require safe integers too. Long deadlines must be scheduled in chunks of at most 2147483647ms, recomputing remaining time rather than relying on browser timer overflow.

## Stable diagnostic assignments

Use the most specific code below. A single failed directive validation emits one primary diagnostic and suppresses derivative errors caused only by that invalid plan. Unrelated independent errors may each emit. Production messages are static templates plus safe generated IDs; never embed expression values or response payloads.

| Code | Condition | Severity and effect |
|---|---|---|
| CONFIG_INVALID | Config lookup/type/unknown-key/range/locale/zone failure | error; root unmounted |
| ROOT_INVALID | Missing/duplicate root name or nested roots | error; affected root unmounted |
| ROOT_ALREADY_MOUNTED | Another App/distribution owns root | error; existing App untouched |
| MODULE_MISSING | Required optional service absent | error; affected feature disabled |
| MODULE_VERSION | Official installer/runtime mismatch | error; installation rejected |
| UNKNOWN_DIRECTIVE | Unregistered ui family/name | error; directive does not execute |
| DIRECTIVE_CONFLICT | Duplicate spellings, sink collision, illegal combinations | error; affected plan disabled |
| DIRECTIVE_VALUE | Invalid literal/enum/integer/presence/placement | error; affected directive disabled |
| DECLARATION_DUPLICATE | Namespace collision | error; conflicting declaration rejected |
| RESERVED_NAME | Declaration overwrites reserved binding | error; declaration rejected |
| JSON_INVALID | Non-JSON/cyclic/accessor/prototype-pollution value | error; value not installed |
| PATH_INVALID | Malformed/forbidden/nonexistent-intermediate writable path | error; write not performed |
| STATE_READONLY | Writes to props/resources/route/aliases/derived | error; write not performed |
| EXPRESSION_PARSE | Unsupported/malformed syntax | error; original HTML retained |
| EXPRESSION_TYPE | Wrong operand/formatter input or nonfinite result | error; null result, effects aborted |
| EXPRESSION_LIMIT | Source/AST/step budget exceeded | error; last valid output retained |
| IDENTIFIER_UNKNOWN | Undeclared lexical identifier | error; null result, effects aborted |
| FORMATTER_UNKNOWN | Call target not a registered pure formatter | error; compile fails locally |
| DERIVED_CYCLE | Computed dependency cycle | error; cycle disabled |
| UPDATE_LOOP | Would start reactive pass101 | error; root reactive work stopped |
| BATCH_ASYNC | Batch returns a promise | error; reject return, keep synchronous writes |
| PERSISTENCE_INVALID | Invalid stored envelope/value/key placement | warning for bad stored data; error for declaration; defaults retained |
| PERSISTENCE_STORAGE | Storage denied/quota failure | warning; live state retained |
| URL_POLICY | Unsafe binding/fragment URL | error for binding; sanitized removal for fragment |
| REQUEST_ORIGIN | Request/import destination denied | error; no transmission |
| REQUEST_INVALID | Header/body/credential/CSRF or request option failure | error; local action/resource failure |
| REQUEST_TIMEOUT | Fetch/body deadline expired | error; normalized timeout/retry policy |
| RESPONSE_TYPE | Nonempty success has wrong media type | error; normalized parse failure |
| RESPONSE_PARSE | Invalid nonempty JSON success | error; normalized parse failure |
| ADAPTER_ERROR | Hook throws or returns invalid value | error; normalized adapter failure |
| ADAPTER_TIMEOUT | Adapter hook deadline expires | error; normalized adapter failure, no retry |
| RESOURCE_SUSPENDED | Explicit refresh lacks required URL scalar | error for explicit command; ordinary auto suspension is not an error |
| RESOURCE_VISIBILITY_TARGET | No observable parent | error; resource not automatically started |
| RESOURCE_UNKNOWN | refresh/invalidation name not a resource | error; command rejected/invalidation name skipped |
| COMMAND_ERROR | Registered command fails | error; remaining handler commands stop |
| REF_INVALID | Missing/duplicate/wrong-kind target ref | error; command/plan rejected |
| DUPLICATE_KEY | Duplicate typed loop key | error; prior list retained |
| LOOP_INVALID | Bad loop syntax/value/key type | error; prior list retained |
| COMPONENT_IMPORT_CYCLE | Import graph back edge | error; affected definitions unavailable |
| COMPONENT_IMPORT | Fetch/type/content/timeout failure importing definitions | error; affected instances unmounted |
| COMPONENT_DEFINITION | Bad name/schema/slot/ID/collision | error; definition unavailable |
| COMPONENT_RECURSION | Instance ancestry exceeds128 | error; local instance fails |
| PROP_TYPE | Missing/invalid/unknown/duplicate prop | error; initial instance fails or last valid reactive value retained |
| SLOT_INVALID | Unmatched projected content | error; instance fails before rendering |
| ROUTE_INVALID | Pattern/fallback/outlet/encoding error | error; compile/navigation rejected |
| ROUTER_DOCUMENT_OWNER | Second active router root | error; second router installation rejected |
| GUARD_ERROR | Navigation guard throws/rejects | error; navigation canceled |
| FRAGMENT_POLICY | Sanitation policy/authorization/candidate/ownership error | error; existing DOM retained |
| FRAGMENT_ACTIVATION | Unexpected failure after swap disposal | error; local safe failure state |
| BEHAVIOR_INVALID | Missing/invalid factory/options/return | error; affected behaviors disabled/cleaned |
| FORM_INVALID | Model/encoding/serialization/field presenter error | error; no submission or invalid model write |
| UI_INVALID | Invalid dialog/tab/toast structure/options | error; affected helper disabled |
| OWNER_DISPOSED | API write/work requested on dead scope | warning in development; operation rejected |
| OWNER_RANGE | Broken ownership anchors/cross-boundary operation | error; broken owner disposed |
| DECLARATION_CHANGED | App mutates mounted directive source | warning; original compiled behavior retained |
| REGISTRY_INVALID | Duplicate/late/incompatible registration | error; registration rejected |
| INSPECTOR_DISABLED | inspect called with debug=false | synchronous typed error |

Normalized HTTP status/network failures use request record errors even when no compile diagnostic is appropriate. Do not emit raw backend errors into diagnostic streams. Canceled operations do not generate REQUEST_TIMEOUT or a new error record. Native HTML validation failure is ordinary form behavior, not FORM_INVALID.

## Release constraints and exclusions

Do not implement a backend authentication product, database, universal SSR renderer, arbitrary hydration, offline mutation queue, automatic auth replay, optimistic mutation engine, websocket/SSE directive, virtualized grid, collaborative conflict resolver, IDE, or large widget suite. Extension examples may integrate an existing chart or editor through the public behavior API. Do not introduce a VDOM, runtime JavaScript evaluation, Shadow DOM component requirement, runtime package discovery, or mandatory application bundler.

The source byte and performance targets remain goals awaiting measurement. Source-specified security controls and required optional-module deliverables remain mandatory. Internal benchmarks may add reproducible run counts/tolerances in their evidence manifest but cannot silently waive a failed source release gate.
