# PlainUI Version 1 Technical Design

*Runtime architecture and implementation plan for the complete 1.0 release*

Companion to RFC 0001 • Revision 0.1 • 10 October 2026 • Status Proposed

## 1 Design purpose and authority

This design describes how to implement PlainUI as a general purpose frontend runtime whose primary authoring surface is HTML with declarative attributes. It covers all capabilities targeted for 1.0: core rendering and state, HTTP and forms, client routing, HTML components, server rendered fragments, optional styles and accessible behaviors, extension APIs, tooling and release qualification.

The public contract is defined by PlainUI Version 1 RFC, revision 0.1. That RFC has precedence over implementation suggestions here. The product direction is established; algorithms, package layout, security mechanisms and numerical budgets here are proposed implementation decisions. No implementation, benchmark result or security certification is claimed by this document.

The architecture uses a small DOM compiler, an interpreted expression language, explicit ownership and fine grained dependency tracking. It does not require a virtual DOM or a backend specific renderer. Optional modules share the same lifecycle and ownership system so advanced interactions do not create a second application model.

## 2 Architecture and package boundaries

| Package | Responsibilities | Must not own |
| --- | --- | --- |
| core | Root lifecycle, compiler, scopes, interpreter, scheduler, bindings, structural ranges and extension registry | Network authentication policy or backend templates |
| data | Fetch pipeline, resources, action records, caching, adapters and invalidation | DOM fragment insertion |
| forms | Models, native validation, serializers, errors and reset | Backend business validation |
| components | Definitions, imports, props, slots and instance lifecycle | Automatic package discovery |
| router | Matching, guards, history, outlet ownership, focus and scroll | Shared store lifetime |
| fragments | HTML parse, sanitization, target arbitration and transactional swaps | JSON resource mutation |
| ui | Native dialog controller, toast region and tabs behavior | Application design requirements |
| styles | Optional CSS tokens, controls and layout primitives | Runtime semantics |
| tooling | Attribute schema, validator, development diagnostics and optional bundling | A mandatory build step |

Core, data, forms and components ship together in plainui.js and plainui.mjs. Router, fragments and UI ship as separate optional modules; a convenience full bundle may compose them. Internal source packages are not separate compatibility contracts. Modules depend on core interfaces and must not import each other's private implementation. The attribute schema is the shared source for compiler validation, CLI linting and reference documentation.

The build emits classic deferred and ESM distributions from the same TypeScript implementation. TypeScript is an implementation choice, not an application requirement. Production packages include source maps, license notices, a machine readable directive schema, exact versions and integrity hashes. The classic runtime performs automatic root discovery; ESM boot is explicit. Zero build examples use local static assets and ordinary HTTP hosting.

## 3 Runtime records and ownership

Every mounted application is an AppContext with options, registries, root scope, scheduler, owner index, cache, request coordinator, diagnostics and an AbortController. An application has one authentication epoch and a monotonically increasing navigation generation. Optional modules register their compiler handlers before mount. AppContext is never stored in a process global singleton shared across roots.

| Internal record | Important fields | Lifetime |
| --- | --- | --- |
| Scope | id, parent, kind, bindings, refs, owner, active | Root, local declaration, loop item or component instance |
| Owner | id, parent, kind, node or range, children, disposers, signal | Exactly as long as its DOM ownership |
| Binding | AST, scope, dependencies, sink, lastValue, diagnostic | Until its owner is disposed |
| Cell | JSON value, version, subscribers, writable | Until defining scope is disposed |
| ResourceController | key, generation, settled state, subscription, active | Resource declaration scope |
| ActionController | generation, record, trigger handler, debounce task | Action element owner |
| RequestEntry | key, controller, subscribers, promise, attempt | In flight transport only |
| CacheEntry | data, acceptedAt, expiresAt, adapterVersion, epoch | Until invalidation, eviction or session reset |
| DomRange | start anchor, end anchor, owner | Conditional, loop item, route or projected slot |

All records have one owner. DOM elements are indexed in a WeakMap; nonnode range records are held by their owner tree. Ownership is explicit even when a fragment inserts content before or after its target. A parent disposes child owners before running its own final removal. Each disposer runs at most once, including when both route disposal and a late observer callback discover the same removal.

Framework operations must not cross root boundaries. ui-ignore descendants have an external owner boundary: the framework can remove the containing region as a whole, but it cannot bind, traverse or swap inside it. Behaviors receive a cleanup callback before their host is removed so their external resources can be released.

## 4 Boot and compilation pipeline

Boot is split into deterministic steps. First resolve application options and module registrations. Then normalize ui-* and data-ui-* names, reject collisions and validate root placement. Discover component definitions, imports and route templates without instantiating inert template content. Resolve the component import graph before mounting component instances. Compile declarations into scopes, parse expressions and event commands into ASTs, and generate binding plans.

After declarations exist, evaluate derived values, instantiate selected structural ranges and component templates, apply initial bindings, install event listeners and begin eligible resources. Remove ui-cloak after the first binding flush and emit a root ready diagnostic event. Import failures must not block unrelated static bindings indefinitely; the affected component owner is marked failed while the rest of the root continues. A request timeout also bounds component import fetches.

The compiler walks DOM nodes rather than rewriting raw HTML strings. It treats template content as an explicit subprogram. Compiler handlers declare priority and ownership requirements: scope creation, declarations, structure, component creation, bindings and behaviors. Illegal combinations are rejected before listeners are installed. Unknown directives never become dynamic code.

A MutationObserver catches app authored additions and removals outside framework transactions. Framework writes carry an internal transaction marker to avoid double compilation. Observed new nodes compile once under their nearest active owner. Moving an existing owned range inside the same scope preserves ownership; moving it across scopes without a public integration operation disposes and remounts it. Changes to declaration attributes after mount are unsupported and produce a diagnostic; reactive values must use bindings. A repeated mount call on an active root returns the same App only when called on that same App; an independent mount attempt fails ROOT_ALREADY_MOUNTED.

The optional validator runs these placement checks statically where possible. It cannot prove runtime API response shapes or arbitrary JavaScript adapter behavior and must distinguish such warnings from errors.

## 5 Expression interpreter

Use a tokenizer and a Pratt parser with explicit precedence tables. The same parser supports value expressions and command arguments, while a separate command parser accepts semicolon separated command calls. set and toggle are special forms whose first argument compiles to an assignable path node. No path is produced by evaluating arbitrary text. Compile ASTs once and memoize by source string and grammar version within a bounded cache.

The evaluator resolves identifiers through Scope records. Reads record Cell and path dependencies. Object access is own property only; forbidden keys are rejected during JSON ingestion, AST evaluation and writes. Never fall back to JavaScript property lookup on attacker supplied prototypes. Arrays expose numeric indices and length. Strings support length through len rather than method invocation. Custom formatters run through a registry with type checked inputs and JSON compatible outputs.

The evaluator has no eval, Function, dynamic import, browser global resolution or ordinary method calls. Literals and deserialized adapter results are copied into safe JSON structures. Undefined is normalized to null at integration boundaries. A returned Date, Map, function, class instance, BigInt or nonfinite number fails normalization rather than quietly leaking into expressions. Object cycles are invalid JSON values. A trusted JavaScript behavior may retain arbitrary objects privately, but cannot put them in declarative state.

Defensive implementation limits match the RFC: at most 16 KiB UTF-8 per expression or command list, 128 AST nesting levels and 10000 evaluator steps per invocation. Exceeding a limit yields EXPRESSION_LIMIT and preserves the last valid binding output. These limits prevent malformed declarations from locking the UI; normal data size is not capped by these expression limits.

### 5.1 Formatting and dates

Formatting uses cached Intl formatters keyed by locale, zone and operation. ISO date only strings represent calendar dates and must not shift to the previous day when a time zone is applied; timestamp strings represent instants. A date only value is displayed in its own calendar day, while timestamps are rendered in the configured zone. Invalid locales, zones or currency codes produce a configuration or formatter diagnostic rather than host dependent output. Formatting output is always text.

## 6 State graph and scheduler

State updates use path based immutable replacement internally. Each write produces new objects along the changed path and increments affected Cell versions. This makes keyed loop item replacement and derived comparisons predictable and avoids exposing unrestricted mutation proxies. app.get returns read only snapshots; app.set and scope.set are the supported mutation paths. app.batch(fn) groups writes, must be synchronous and rejects a returned promise.

Bindings subscribe to paths they read. A parent object replacement invalidates all descendant path subscribers; a child write invalidates that child path, ancestors read as whole objects and iteration dependencies, but not unrelated sibling leaf reads. Dynamic branch reads replace their dependency set after each evaluation. Derived values form a directed graph; cycle detection uses an evaluation stack and records the cycle for diagnostics.

Each microtask flush has ordered queues: recompute derived values, apply structural changes, apply value bindings, update accessibility state, run postflush tasks. Structural disposal can remove queued child work; the scheduler checks owner liveness before every operation. A write during flush schedules another pass in the same microtask. After 100 passes without quiescence, stop that root's reactive work and emit UPDATE_LOOP rather than hanging the page. A programmer can unmount and repair it; unrelated roots remain operational.

DOM sinks compare the previous rendered value and skip no op writes. Input bindings avoid overwriting the focused control when its normalized value already equals the model, preserving selection and composition. Resource resolution enters through a scheduled state transaction rather than directly mutating DOM in a promise callback.

Persistence is an effect after successful state commit. Reads happen before initial derived evaluation; writes are coalesced per flush. Storage errors never roll back UI state. Persisted JSON is validated with the same safe JSON routine. Session reset clears memory resources and in flight requests; persisted state is application owned and must be explicitly cleared by the logout command if it contains user specific data. The documentation must make that distinction visible.

## 7 Structural rendering algorithms

Each conditional chain owns anchors surrounding its active branch. Evaluate branches in source order and instantiate the first truthy branch, or the final else. Branch teardown releases listeners, requests and behavior cleanup before removing the range. ui-show uses the existing node and changes hidden only; it retains resource subscriptions and local state.

A keyed loop stores a Map from typed key to item owner and an ordered array of keys. Compute the next key set completely before changing DOM. Reject duplicates or invalid keys atomically. Reuse owners for matching keys, update their read only item and index bindings, create owners for new keys and dispose missing owners. Move entire anchored ranges in the new order. Start with a straightforward O(n) map reconciliation; a longest increasing subsequence optimization is allowed only if benchmarks show a real benefit without changing focus or lifecycle semantics.

Key reuse intentionally preserves local state even if the corresponding item object changes. Applications must choose identity keys, not array indices for editable or reorderable collections. An unchanged key with a changed item value updates data bindings and does not rerun instance initialization. Focus follows a moved DOM node; deleted focused content falls back to its list container when appropriate.

## 8 Resource and request coordinator

Transport preparation evaluates the URL, query, headers and body, normalizes them, runs the selected prepare adapter, then reapplies origin, method, credential, CSRF and header policy. The final request is immutable. The coordinator calculates a request key using canonical ordered metadata and a cryptographic digest for secret header values retained only in memory. Diagnostic keys are independent redacted identifiers. Key construction must include adapter version and authentication epoch.

The request pipeline uses Fetch with redirect set to error and an AbortController for timeout. It consumes the body once, validates the expected content type for nonempty successful bodies, parses JSON if appropriate and invokes the normalization hook. HTTP failures may parse JSON for error mapping but must never execute or render the response body directly. The response metadata given to adapters includes status and allowed response headers; browser filtered headers stay filtered. 204 and empty successful bodies become null.

Adapters can be asynchronous, so liveness and generation checks run after every await, not just after fetch. An accepted success commits data, status, empty, stale, timestamps and cleared errors as one transaction. An accepted failure commits a normalized error and keeps only previous data for the same request key. The record's internal hasSuccess flag distinguishes successful null from no data. Cancellation restores the last settled record only if its generation is still current.

### 8.1 Concurrency algorithm

For an automatic resource load, increment its generation and release the old subscription. Evaluate the new key. If the key is incomplete, clear the prior entity value and stop in idle. Otherwise use a fresh cache entry or attach a subscriber to a matching in flight GET. If no entry exists, create one. When the promise resolves, commit only if the owner is active, generation matches, key matches and authentication epoch matches. All four conditions are required.

Subscriber cancellation removes only that subscriber. Abort transport only when no subscriber remains. A resource refresh invalidates a key before joining or starting its revalidation; concurrent refresh calls may share the same new transport. It cannot join an older transport started before that invalidation generation. Response data from a superseded cache generation cannot repopulate the cache.

When a mutation succeeds, resolve ui-invalidate names in the action scope, mark corresponding keys stale, then refresh active automatic consumers. Invalidations must be scheduled before on:success handlers, so handlers observe the invalidated state. A success handler may explicitly await refresh; already scheduled equivalent revalidation is shared. The mutation itself never reruns because a refresh failed.

ui-load="visible" observes the resource template's nearest parent element, because an inert template has no display box. If that parent cannot be observed, the compiler reports RESOURCE_VISIBILITY_TARGET and requires another wrapper. Once first visible, the resource behaves as auto until disposed. Polling, focus revalidation and online revalidation are not implicit features in 1.0.

### 8.2 Cache and session boundaries

Maintain an LRU map per root with bounded entries. Each entry stores accepted data, freshness deadline and a cache generation. With ui-cache=0, settled data is held in the resource controller but no reusable cache entry is retained. Multiple declarations sharing a key may choose different freshness durations; eligibility is evaluated using each declaration's duration against acceptedAt, not a global longest TTL. A new subscriber with a shorter duration can trigger revalidation shared by all subscribers.

app.resetSession increments the authentication epoch first, aborts all active operations, clears cached values and resets resource and action records to idle. A late old epoch response cannot commit. Local and shared state is not automatically erased because it may contain anonymous preferences; the application's logout command performs any needed state reset explicitly. No data crosses roots or persists to service worker storage.

## 9 Action controller and forms

Each declarative action creates an event listener plus an ActionController. The listener first applies allowed modifiers, captures the submitter and event snapshot, performs native validation for forms, serializes input and performs synchronous request checks. It then prevents native form navigation within the original event dispatch, marks pending and applies pending affordances before awaiting adapter preparation or network work. Later preparation failures become action errors without replaying the native submission. If invalid configuration prevents enhancement, a valid native form fallback is left available and a diagnostic explains why enhancement did not attach.

Debounce timers are owned by the action and canceled on disposal. drop ignores triggers while pending; replace increments generation and aborts the old attempt. Native disabling is stored as an original value plus an operation token so one completion cannot enable a control disabled by another owner. Action records settle before lifecycle handlers. finally also runs on canceled operations with a context canceled flag, but disposed scopes do not execute user commands after removal; cleanup observers may still receive cancellation for diagnostics.

Form serialization starts from successful controls and the submitter rather than a query selector that would miss native semantics. JSON mode converts only number and range inputs, groups repeated names, rejects files and preserves literal key names. Multipart mode uses FormData with submitter support or a documented compatibility path. GET mode uses URL encoded pairs and rejects body declarations. ui-body replaces serialization altogether and is evaluated as JSON state.

Model bindings have per control adapters for text, numbers, checkboxes, radio groups and multi select. A composition flag delays writes during IME input. Radio group synchronization avoids dispatching change events recursively. Form reset snapshots are captured after initial state and persistence resolution, before the first user interaction. Snapshots contain only model paths bound within the form, so reset cannot overwrite unrelated state.

Field error presenters are indexed by literal field name in the enclosing form owner. They create stable message IDs and preserve author provided aria-describedby tokens. On cleanup or error clearing, remove only tokens and aria-invalid values that PlainUI owns. Multiple messages for one field remain available in the normalized error object even when the presenter displays only the first. Unknown fields are surfaced in a recommended summary pattern, never silently marked as a valid form.

## 10 Component compiler and import graph

The component loader resolves explicit same origin URLs against the document URL and fetches each unique URL once per root. The cache stores validated definition templates, not live DOM or instance state. A depth first import walk detects cycles using a visiting set and records the full cycle path. Imported documents are parsed inertly; only component definitions and permitted nested import declarations are read. Imports never execute scripts or install styles. A failed dependency prevents its dependent components from mounting.

Compile definitions to reusable binding plans and clone DOM per instance. Clone default JSON props and local state per instance. Caller side ui-prop expressions subscribe in caller scope; their values flow into read only component cells. PlainUI does not register these template backed tags with customElements in 1.0; it mounts them inside owned roots, avoiding a global definition collision between roots. An already registered third party custom element must be integrated with a behavior or ordinary HTML, not redefined as a PlainUI component.

Capture instance child nodes before rendering the definition. Assign them to named or default slot ranges. Projected nodes compile in the caller scope but are disposed through the component's slot owner. Component fallback nodes compile in component scope. This split requires explicit lexical scope and owner references; parent DOM position alone is insufficient. Duplicate slot names in a definition are invalid in 1.0 so each projected node has one destination.

Components render in light DOM. Styles apply through classes and ordinary selectors; optional tooling may help prefix classes but no scoped CSS compiler is required. DOM IDs inside repeated component definitions must be unique per instance when used for labels or ARIA. The compiler rewrites static local IDs and matching for, aria-labelledby, aria-describedby and aria-controls references with an instance prefix. Cross component ID links must use explicit props rather than relying on rewritten internal IDs. This rewriting rule follows RFC section 11.

## 11 Router design

Compile route patterns into ranked segment records at mount. Compare literal count and segment specificity from left to right; detect equivalent ambiguous patterns up front. Matching returns a new read only route object. Route state never enters the shared writable store. The router maintains an indexed history entry with an application namespace, prior scroll and route identity; preserve unrelated history.state fields.

Navigation is a transaction with prepare, guard, commit and postcommit stages. Prepare parses the destination and allocates a navigation generation. Guard runs registered callbacks with from, to and an AbortSignal. It may cancel without changing the current view. Commit disposes the old route range, publishes route state, mounts the destination and records the committed history index. Postcommit handles title, focus and scroll after bindings flush. Resource fetching within the new page is asynchronous and does not prevent a committed route from showing loading or error states.

For popstate, the browser has already moved its URL. A rejected guard calculates the delta to the last committed index and moves history back with a suppression token. Suppressed correction events must not rerun guards or add entries. Initial entries without a PlainUI index are adopted with replaceState; traversal outside the app's known history must use normal browser navigation rather than guessing a delta. Hash mode follows the same transaction model using an indexed state record.

Save scroll before leaving. On new navigation set top after mount; on traversal restore the saved position after the first flush. Hash targets take precedence and may require an application hook for content loaded later; the router does not poll indefinitely. Focus is not restored to disconnected nodes. beforeNavigate guards can protect unsaved forms, but the browser's separate unload prompt rules remain outside the router.

## 12 Fragment security and commit protocol

Fragments use a dedicated HTML service, not the JSON adapter or ui-text sink. Sanitize with a maintained allowlist implementation behind a small adapter that can be updated independently; choose and pin the actual sanitizer dependency before beta. Handwritten regular expressions are not an acceptable sanitizer. The dependency choice must support the required browser matrix and strict Trusted Types deployments. The default policy is part of the public release artifact and is regression tested.

### 12.1 Default allowlist

Permitted elements are a, abbr, article, aside, b, blockquote, br, button, caption, code, col, colgroup, dd, details, dialog, div, dl, dt, em, fieldset, figcaption, figure, footer, form, h1 through h6, header, hr, i, img, input, label, legend, li, main, nav, ol, optgroup, option, p, pre, section, select, small, span, strong, sub, summary, sup, table, tbody, td, textarea, th, thead, time, tr and ul. Unsupported elements are removed while safe text descendants are retained, except script, style, iframe, object, embed, SVG and MathML subtrees, which are removed completely. Template is permitted only in trusted enhanced mode and only for allowed structure, never imports or new definitions.

Permitted attributes are id, class, title, lang, dir, role, aria-*, nonframework data-*, href, target, rel, src, alt, width, height, name, value, type, disabled, required, readonly, multiple, checked, selected, placeholder, min, max, step, pattern, for, action, method, enctype, colspan, rowspan, scope, datetime, open, hidden, tabindex, slot and the supported enhanced directives when authorized. on*, srcdoc, style, formaction and formtarget are removed. Link targets other than _self or _blank are removed; _blank requires rel noopener noreferrer. href, src and action use context specific URL policies; form actions must be same origin. The allowlist must account for data-ui-* before the broader data-* allowance so directives cannot bypass the trust switch.

Enhanced mode preserves only reviewed bindings, state, model, structural, request, event, ref, component prop and behavior directives. It still rejects ui-app, ui-config, ui-store, ui-route, ui-outlet, ui-component and ui-import. Component host tags must exist in the registry and their allowed props must validate. Behaviors and request directives imply trusted developer code; a same origin URL alone is not proof of that trust.

### 12.2 Atomic swaps

At trigger time, resolve the destination owner and increment its generation. Fetch and sanitize without changing existing DOM. Compile the detached candidate against an isolated provisional scope that does not start requests or behaviors. Validate target ownership, outer root count, refs, IDs, directives and module availability. If any error occurs, discard the candidate and report failure through the action.

Before commit, recheck action generation, target generation, authentication epoch and destination liveness. Capture active element and destination reference. Dispose the replaceable range, insert the candidate in a single transaction, then activate its bindings, resources and behaviors. If activation throws unexpectedly, the old disposed subtree cannot safely be resurrected; render an explicit local failure state, emit FRAGMENT_ACTIVATION and keep the root usable. Parsing, policy and compile failures must be detected before disposal to make this case exceptional.

Only before, after, append and prepend can add without replacing existing owners. They still create an owned range so later target or route disposal removes listeners and requests. The module never inserts head elements, runs scripts from responses or morphs arbitrary component internals. A JSON resource region and fragment target may coexist under a page, but their ownership ranges cannot overlap.

## 13 Optional UI and CSS architecture

The CSS layer uses tokens and low specificity selectors so application CSS can override it. Basic components are styled native elements or opt in classes. Use logical properties for direction support and prefers-reduced-motion for animation. Theme examples may use prefers-color-scheme, but the core stores no theme preference unless the application declares one. Responsive layouts rely on CSS grid and flexbox, without viewport state in the reactive graph.

The dialog behavior uses native dialog APIs. It records the opener, validates the accessible name, calls showModal and restores focus on close if that opener remains connected. Toast delivery appends text into a polite live region and a visible list, with bounded retention and a dismiss button for persistent messages. Toasts do not substitute for an action's durable error state.

Tabs behavior validates the tablist and panel relationships, applies roving tabindex, handles Arrow, Home and End keys, and uses manual activation by default. It preserves author provided labels and listens through its owner signal. UI tests must cover keyboard behavior, disabled tabs, removal of the active tab and repeated mount/unmount. No large table, kanban or editor implementation is a prerequisite for the framework release.

## 14 Extension APIs and diagnostics

Registries store immutable named entries with compatible API major version metadata. registerCommand, registerFormatter, registerBehavior and registerAdapter reject duplicate or built in names. The public TypeScript declarations document argument types and abort behavior. Examples must also show plain JavaScript usage so backend developers are not forced to learn TypeScript.

A behavior receives a scoped API with get, set, batch, refresh, refs, emit, afterFlush and signal. afterFlush schedules a cancellable postflush task. Commands additionally receive a safe event snapshot and trusted host access. All state writes check the active scope flag. Async results returning after disposal are ignored with a development warning. A cleanup callback is allowed to release resources but cannot schedule new reactive work for a dead scope.

Adapter definitions carry a version string as part of cache identity. prepare receives a normalized draft request; success and error see already parsed data and response metadata. The adapter may map envelopes or attach short lived authentication headers. It cannot turn an allowed request into a disallowed origin after validation. An auth refresh flow must live in an explicit registered command or application wrapper; core does not automatically replay mutations.

Diagnostics have code, severity, rootId, ownerId, directive, location and a redacted message. Development mode includes expression spans and component import paths. Production mode omits data values and stack traces unless the application explicitly subscribes to diagnostic events. Expose an inspector snapshot of owner counts, active subscriptions, pending actions and cache entries without bodies or secrets. No telemetry transport is bundled.

Representative codes are UNKNOWN_DIRECTIVE, DIRECTIVE_CONFLICT, EXPRESSION_TYPE, EXPRESSION_LIMIT, DERIVED_CYCLE, UPDATE_LOOP, REQUEST_ORIGIN, REQUEST_TIMEOUT, RESPONSE_TYPE, ADAPTER_ERROR, DUPLICATE_KEY, COMPONENT_IMPORT_CYCLE, PROP_TYPE, MODULE_MISSING, FRAGMENT_POLICY and OWNER_DISPOSED. The registry assigns stable codes; wording may improve in patch releases.

## 15 Testing and verification strategy

Tests must verify observable contracts rather than duplicate implementation structure. A shared conformance fixture contains input HTML, initial options and responses, user events, expected DOM and state, and expected diagnostics. Run the same fixtures against classic and module builds. The CLI validator consumes static fixture declarations and must agree with runtime errors for rules it can check.

| Test group | Representative required cases |
| --- | --- |
| Parser | Precedence, quoted semicolons, forbidden keys, malformed paths and resource limits |
| Scope | Shadowing, component isolation, caller scoped slots and reserved names |
| State | Multiple synchronous writes, derived cycles, branch dependency changes and persistence failure |
| Structure | Duplicate keys preserve old DOM, reorder preserves input focus and removal disposes once |
| HTTP | Late old response, shared GET cancellation, adapter delay, timeout, rejected redirect and epoch reset |
| Actions | Double submit drop, replace with unknown server outcome, handler failure and finally behavior |
| Forms | IME input, radio groups, submitter, literal dotted names, repeated fields, files and validation errors |
| Router | Parameter ranking, deep links, fast navigation guards, rejected back navigation and scroll |
| Components | Import cycles, prop type errors, slot fallback, static ID rewriting and cleanup |
| Fragments | Cross target races, sanitizer payloads, directive stripping, outer swap restrictions and CSP |
| UI | Keyboard tabs, dialog focus return, toast announcements and zoom |
| Extensions | Third party widget disposal, rejected postdisposal writes and adapter cache versions |

Use fake clocks and a deterministic mock HTTP server for retry, debounce and race fixtures. Include randomized response ordering and property based parser tests. Browser integration tests are required for forms, composition, history, focus and native dialogs; a DOM emulator alone is insufficient. Security fixtures include malformed HTML, entity encoded URLs, mutation XSS cases, data-ui-* bypass attempts, prototype pollution and sanitizer configuration regression.

Reference applications provide end to end coverage across product types. Keep at least two independent backend examples with different languages or frameworks implementing the same API fixtures, plus one server fragment implementation. A compatibility test runs the unchanged frontend against both JSON servers. No benchmark or coverage percentage alone substitutes for these behaviors.

## 16 Performance and reliability budgets

The release budgets are proposed gates: core at most 35 KiB gzip; core plus router, fragments and UI at most 70 KiB gzip; and a ten item update in a 1000 item keyed list under 16 ms at p95 on the reference machine. These include runtime code and mandatory sanitizer dependencies but exclude application assets, source maps and optional CSS. Publish each module's size independently so users can understand the cost of their selection.

Before beta, fix a reproducible benchmark manifest recording CPU, operating system, browser build, power settings and repository commit. Run 30 warmup updates followed by 200 measured updates; report p50 and p95 scripting plus DOM commit time, and separately report layout and paint. Avoid claims of universal frame rate from one machine. Include cold boot for 1000 bindings, component import waterfalls and a 100 route transition memory profile as diagnostic benchmarks, even where no hard latency threshold is yet adopted.

The lifetime reliability gate requires zero live owners, request subscribers, timers or framework event handlers after unmount in instrumented tests. Heap samples after repeated route transitions must plateau after garbage collection within a documented tolerance. Detached DOM retained by application code is reported separately. Cache entries must never exceed maxEntries, and sanitizer or import failures must leave unrelated application regions usable.

The principal risk to the byte budget is fragment sanitization. Measure this at the first integration milestone. Do not weaken the sanitizer to satisfy a bundle target. If the dependency exceeds the proposed budget, revise the numerical budget openly while preserving the security contract.

## 17 Delivery sequence through version 1

Milestones organize implementation; they do not redefine the release scope. An early core demo is not 1.0. Each milestone produces reviewable code, fixtures and updated documentation, and later milestones close the complete RFC contract.

| Milestone | Deliverables | Exit condition |
| --- | --- | --- |
| Contract baseline | Approved RFC syntax, attribute schema, state model and threat model | Examples parse and disputed defaults are resolved |
| Runtime foundation | Interpreter, scopes, ownership, scheduler, bindings and structures | Core conformance and disposal fixtures pass |
| Data and forms | Resource/action pipeline, cache, adapters, serialization and errors | Race, auth boundary and validation fixtures pass |
| Full composition | Imports, props, slots, router, guards and history | Public blog and SaaS flows run end to end |
| Hybrid rendering and UI | Sanitizer, fragment commits, dialog, tabs, notifications and CSS | Hybrid storefront flow and security fixtures pass |
| Extensions and tooling | Stable JS surface, widget example, validator, distributions and docs | Zero build and module examples match |
| Beta qualification | All three reference apps, second backend, browser and performance runs | No unresolved release blocking contract gap |
| Release candidate and 1.0 | Accessibility review, security review, compatibility matrix and migration guide | All RFC acceptance gates pass with recorded evidence |

No calendar dates or staffing estimates are implied. A scope change requires an RFC revision with its impact on examples, tests and compatibility. Optional modules cannot be deferred past 1.0 while the release claims conformance to this full specification.

## 18 Risks and decision record

The largest usability risk is an attribute language that becomes as complex as general JavaScript. Keep expressions pure, command grammar narrow and complex business behavior in named JavaScript commands. Test comprehension with backend developers implementing the three reference apps from documentation. Record where custom JavaScript is needed and whether it is a natural extension or a missing ordinary primitive.

The largest correctness risk is competing DOM ownership. Every route, component, structural range, fragment and behavior must pass through the owner index and dispose protocol. Overlapping ownership is a compile error. The largest security risk is treating server HTML as implicitly trusted; default stripping and explicit enhanced mode must remain separate even for same origin endpoints.

Other material risks include import waterfalls, CSP sink compatibility, backend error envelope diversity, history restoration during async guards and form serialization surprises. Explicit imports, adapter fixtures, browser integration tests and ordinary native fallback behavior address these risks. SSR hydration, offline replay and distributed collaboration would materially alter the model and require separate post 1.0 RFCs.

The selected sanitizer package, precise reference benchmark hardware and release browser version numbers remain implementation selections, not missing product behavior. They must be fixed and recorded before beta. Public defaults proposed here, including expression limits, static component ID rewriting and fragment allowlists, must be merged into the RFC before its acceptance; the paired revision delivered with this design includes those clarifications.

## 19 Requirement traceability

| RFC area | Implementation ownership | Completion evidence |
| --- | --- | --- |
| Sections 3 and 4 startup and syntax | Compiler, interpreter and schema | Distribution parity and parser fixtures |
| Sections 5 and 6 state and rendering | Scope graph, scheduler and DomRange | Reactive, structural and disposal tests |
| Sections 7 and 8 resources and actions | Coordinator, adapters and controllers | Race, cache and lifecycle fixtures |
| Section 9 forms | Model adapters and serializers | Native form browser tests |
| Section 10 navigation | Router transaction and history manager | Navigation, guard and focus scenarios |
| Section 11 components | Definition loader and projection compiler | Cross backend reusable components |
| Section 12 fragments | Sanitizer and commit service | Security suite and atomic swaps |
| Section 13 styling and access | CSS and UI modules | Responsive, keyboard and assistive review |
| Sections 14 and 15 extension and security | Registries, sink policies and diagnostics | Widget lifecycle and CSP examples |
| Sections 16 through 18 registry and release | Schema, reference apps and release pipeline | Complete attribute coverage and signed off gates |

## 20 Platform references

Consulted 10 October 2026. These primary specifications guide browser integration; PlainUI semantics are defined by the companion RFC.

WHATWG HTML Living Standard. https://html.spec.whatwg.org/multipage/

WHATWG Fetch Standard. https://fetch.spec.whatwg.org/

W3C Content Security Policy Level 3. https://www.w3.org/TR/CSP3/

W3C WAI ARIA modal dialog pattern. https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
