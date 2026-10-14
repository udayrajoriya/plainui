# Foundation tasks

All file paths are repository-relative. All tasks include the common definition of done in 00-plan. Scenario identifiers below become executable fixture IDs rather than prose-only checklists.

## T001 Freeze the implementation baseline

**Status:** completed 10 October 2026. [Completion evidence](../../evidence/tasks/T001.md). Revision 0.2 acceptance remains proposed and is tracked separately from task completion.

**Depends on:** none. **Sources:** RFC §§1,19; Design §§1,18. **Files:** `docs/decisions/0001-baseline.md`, `docs/specification/`, `evidence/spec-baseline.json`.

1. Record SHA-256 hashes, titles, revisions, and dates of both supplied DOCX files. Preserve their originals.
2. Produce text/Markdown transcriptions preserving numbered sections, tables, examples, and normative keywords. Check every table row against the DOCX XML text; do not transcribe only headings.
3. Copy each C01–C14 plan decision into a decision record with source clause, selected behavior, rationale, and affected fixture family.
4. Draft a revision containing every **Specification clarification**, especially ready/diagnostics APIs, outer-ref handling, enhanced-template allowance, one router per document, refresh coalescing, and toast options. Explicitly mark it proposed until accepted by the project owner; implementation can follow this plan as its proposed baseline, but release cannot claim an accepted RFC while that decision is pending.
5. Record precedence: RFC public behavior, accepted clarification, design algorithm, then implementation detail. Resolve Design cache expiresAt and router ranking as C08/C11 specify.
6. Create an exclusion list matching 00-plan. Attach no estimates or promised dates.

**Acceptance:** `baseline.sources` hashes both inputs; `baseline.decisions` has C01–C14; `baseline.clarifications` lists every change to public semantics with no hidden TBD; no source document is overwritten.

## T002 Initialize the workspace and pin tools

**Status:** completed 11 October 2026. [Completion evidence](../../evidence/tasks/T002.md).

**Depends on:** T001. **Files:** root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.node-version`, `.npmrc`, `.editorconfig`, `.gitignore`, `tsconfig.base.json`, `evidence/dependencies/`.

1. Initialize a Git repository only if one still does not exist; do not create a remote or publish anything. Ignore node_modules, dist, browser reports, local secrets, and transient coverage; retain evidence manifests and source fixtures.
2. Create private workspace manifests for the C02 directories. Set root packageManager to `pnpm@12.10.1`, Node engine to `>=24.21.0 <25`, and node-version to 24.21.0 for the reproducible build runner.
3. Install the exact C01 versions, save the lockfile, and archive official registry version metadata plus integrity values. Use frozen-lockfile installs thereafter.
4. TypeScript options: strict=true, noUncheckedIndexedAccess=true, exactOptionalPropertyTypes=true, useUnknownInCatchVariables=true, declaration=true, sourceMap=true, target=ES2022, module=ESNext, moduleResolution=Bundler, lib=ES2022/DOM/DOM.Iterable. Browser code excludes Node ambient types.
5. Add cross-platform Node scripts rather than shell-specific command chains. Script names: `typecheck`, `test:unit`, `test:conformance`, `test:browser`, `test:security`, `build`, `validate:examples`, `check:generated`, `check:boundaries`, `check:size`, `bench`, `check:release`.
6. Run a minimal TS compile, Vitest assertion, esbuild classic/ESM build, and one Playwright page in Chromium/Firefox/WebKit. If a dependency combination fails, document the incompatibility and change the exact pin in C01 before proceeding.

**Acceptance:** `workspace.clean-install` succeeds from empty node_modules; `workspace.lock` fails if package metadata diverges; `workspace.windows` and `workspace.linux` execute the same scripts; smoke results record actual tool versions.

## T003 Establish package boundaries and build entry points

**Status:** completed 14 October 2026. [Completion evidence](../../evidence/tasks/T003.md).

**Depends on:** T002. **Sources:** Design §2. **Files:** `scripts/build.mjs`, `scripts/check-boundaries.mjs`, each package `src/index.ts`, runtime entry files.

1. Define allowed imports: core→schema; data/forms/components→core/schema and declared service interfaces; runtime→core/data/forms/components; each optional module→schema/core's official module bridge only. Forms may consume a data action-service interface; it must not import controller implementation.
2. Put shared request/DOM service interfaces in core integration types to break cycles. Inject implementations during runtime composition.
3. Make build entry stubs for the required distribution filenames and CSS. Use classic IIFE for `.js`, ESM for `.mjs`, minification for release, source maps alongside output.
4. Configure ESM optional modules to import the public runtime's module bridge by relative distribution path, never bundle another core. Classic modules consume the existing `window.PlainUI` bridge and fail clearly if core is absent.
5. Add a source import-graph checker that rejects boundary violations and cycles. Ensure DOMPurify appears only in fragments, never core.
6. Generate development builds from the same entry source with debug assertions enabled. Do not maintain separate implementations for classic/ESM.

**Acceptance:** `build.boundaries` deliberately illegal imports fail; `build.no-duplicate-core` optional artifacts exclude core implementation; `build.entries` all filenames exist; `build.no-eval` no eval/Function constructor appears in emitted browser code.

## T004 Create the directive and option schema

**Status:** completed 14 October 2026. [Completion evidence](../../evidence/tasks/T004.md).

**Depends on:** T001,T003. **Sources:** RFC §§3,16. **Files:** `packages/schema/src/{directives,options,diagnostics,allowlists}.ts`, `scripts/generate-schema.mjs`.

1. Enter every registry row, dynamic family, alias, enum, default, value kind, placement, companion requirement, conflict, and optional module from 07-coverage.
2. Represent presence flags as empty-string-only, integer literals with exact min/max, and identifiers with the RFC regex. Do not parse attributes heuristically by looking at their contents.
3. Add cross-attribute rules: one HTTP method; resource requires empty template/get; GET forbids body; loop requires key; if/for conflict; model conflicts value/checked; show conflicts hidden; text conflicts owned children/outlet/component/field-error.
4. Add configuration schema from RFC §3.1 and C07, plus prop/behavior-specific schemas. Reject unknown keys recursively.
5. Define stable diagnostic codes for every validation rule, mapping to severity and redaction-safe template. Retain all codes named in either source and the plan; do not use free-form exceptions as public diagnostic identifiers.
6. Generate JSON schema/metadata and the directive reference table from this source. Include grammar/schema versions for fixture compatibility.
7. Add a checker that enumerates registry rows and requires valid, invalid, lifecycle coverage IDs for each spelling/family.

**Acceptance:** `schema.aliases` canonical/data aliases match; `schema.collisions` duplicates fail; `schema.complete` all source rows map to tasks; generated files reproduce byte-for-byte.

## T005 Build the shared conformance fixture runner

**Status:** completed 14 October 2026. [Completion evidence](../../evidence/tasks/T005.md).

**Depends on:** T003,T004. **Sources:** Design §15. **Files:** `tests/support/{fixture,runner,clock,server,assertions}.ts`, `tests/fixtures/schema.json`.

1. Define fixture fields: id, RFC references, HTML, config, module list, registrations, storage seed, HTTP script, steps, expected state/DOM/events/diagnostics, teardown expectations, browser requirements.
2. Provide steps for mount, awaitReady, set, dispatch, user input, resolve/reject request, advanceClock, flush, navigate, unmount, and inspect. Each wait has an explicit predicate and maximum timeout; no arbitrary sleeps in deterministic tests.
3. Run each compatible fixture once with classic local assets and once with ESM assets. Reset page, storage, registries, history, and server state between fixtures.
4. Create a local HTTP server able to hold responses behind named barriers, return chosen status/headers/body, redirect, close sockets, record requests, and expose two distinct origins. Never depend on public network services.
5. Inject clock/fetch/randomness only through private test service construction, not a supported production transport replacement API.
6. Capture ordered lifecycle events, binding commits, final state, request counts, normalized diagnostics, and instrumented live-owner/timer/listener/subscriber counts.
7. Ensure all test-created deferred promises/timers drain or cancel in finally. Add harness self-tests proving an intentional leak or unexpected request fails.

**Acceptance:** `harness.parity` same fixture yields same result in both builds; `harness.race` barriers reverse completion order; `harness.leak` intentional leaked listener is detected; `harness.timeout` missing completion gives a useful bounded failure.

## T006 Implement configuration and diagnostic infrastructure

**Status:** completed 14 October 2026. [Completion evidence](../../evidence/tasks/T006.md).

**Depends on:** T004,T005. **Sources:** RFC §§3,14,15. **Files:** `packages/core/src/config.ts`, `diagnostics/{codes,emit,redact,inspector}.ts`.

1. Resolve ui-config by document ID; require exactly one script[type=application/json], parse as safe JSON, and report missing/duplicate/wrong-type elements.
2. Merge/validate C07 defaults, block, and programmatic overrides. Validate origin lists, URL base, locale, zone, integer ranges, enums, and CSRF header/meta names.
3. Return immutable resolved options. Do not store tokens read from meta in config.
4. Implement diagnostics subscription before mount, unsubscribe, stable location (root-relative child path plus directive), and one dispatch path for compile/runtime/network errors.
5. Redact all dynamic data; safe debug spans include offsets and directive names, not raw header/body/URL-template substitution values. Query strings and URL credentials are removed from displayed locations.
6. Implement inspector counters and debug gating. Counters change at allocation/release sites and cannot keep owners alive by holding references.
7. Catch diagnostic listener exceptions so user logging cannot break disposal or compilation.

**Acceptance:** `config.precedence`, `config.unknown-nested`, `config.bad-json`, `config.locale-zone`, `diagnostic.redaction`, `diagnostic.listener-throws`, `inspector.disabled`, and `inspector.zero` pass.

## T007 Prove sanitizer size and strict CSP feasibility early

**Status:** completed 14 October 2026. [Completion evidence](../../evidence/tasks/T007.md).

**Depends on:** T003,T005. **Sources:** Design §§12,16. **Files:** `experiments/sanitizer/`, `evidence/sanitizer-feasibility.md`, `evidence/size-baseline.json`.

1. Build a minimal fragment-only bundle importing the pinned DOMPurify. Configure explicit RFC tag/attribute sets and DOM-fragment output.
2. Serve a test page with external JS only, `script-src 'self'`, no unsafe-eval, and enforced Trusted Types where supported. Allow precisely the private `plainui-template` and `dompurify` policy names.
3. Prove developer template import parsing through the private core HTML service can validate inert templates without adding the sanitizer to core. Ensure scripts do not execute while importing or cloning a definition.
4. Prove untrusted sanitization strips directives and enhanced mode can retain only the published permitted subset, including inert declaration templates.
5. Exercise a native component import plus an HTML fragment on the same strict-CSP page. Log CSP violations as test failures.
6. Measure raw/gzip bytes of core scaffold, optional sanitizer bundle, and combined script set using the production compressor parameters in T094. Record remaining budget; do not claim final size conformance from a scaffold.
7. If the sanitizer makes the combined budget unattainable, create a numerical-budget revision proposal now. Do not replace it with regex, loosen policy, or silently exclude dependency bytes.

**Acceptance:** `spike.csp-template`, `spike.csp-fragment`, `spike.no-script-execution`, `spike.allowlist`, and recorded size evidence exist. This is a feasibility gate; T062 still supplies production hardening.

## T008 Implement safe JSON and writable paths

**Status:** completed 14 October 2026. [Completion evidence](../../evidence/tasks/T008.md).

**Depends on:** T006. **Sources:** RFC §§4,5,14,15; C04,C05. **Files:** `packages/core/src/json/{normalize,clone,freeze}.ts`, `state/path.ts`.

1. Normalize JSON with iterative traversal to avoid stack overflow on deeply nested input data. Track active ancestry for cycle detection, not a global seen set that rejects harmless repeated references.
2. Read property descriptors before values; reject getters/setters, symbols, class prototypes, sparse-array holes normalized to null only at explicit JS boundary, and prohibited keys at every depth.
3. Normalize undefined to null, reject nonfinite numbers, and use null-prototype internal object records.
4. Parse the path subset in C05 with source spans. Distinguish literal array index from object property. Reject forbidden keys before lookup.
5. Implement immutable path replacement, missing-intermediate errors, bounds checks, and root-cell writability checks. Return changed path prefixes for invalidation.
6. Expose detached frozen snapshots; never return internal mutable state from public get or props.

**Acceptance:** `json.pollution` tests nested/computed forbidden names; `json.getter` getter invocation count stays zero; `json.cycle`, `json.class`, `json.undefined`, `path.sibling-sharing`, `path.readonly`, `path.missing-container`, and snapshot mutation tests pass.

## T009 Implement tokenizer and Pratt expression parser

**Status:** completed 14 October 2026. [Completion evidence](../../evidence/tasks/T009.md).

**Depends on:** T008. **Sources:** RFC §4.1; C05. **Files:** `packages/core/src/expression/{tokens,tokenize,ast,parse,precedence}.ts`.

1. Tokenize exact literals/operators/punctuation, tracking UTF-16 source offsets and total UTF-8 input bytes. Check 16 KiB before tokenization.
2. Parse literals, quoted-key objects, arrays, identifiers, unary/binary operators, ternary, dot/index access, and allowed identifier-call syntax using the C05 precedence table.
3. Track parenthesization explicitly for coalescing-mix validation. Reject assignment, loose equality, new, functions, arrow functions, template strings, regex literals, and member-method calls.
4. Enforce maximum AST depth 128 independently of parser recursion; check a guarded recursion counter before each Pratt descent and separately track constructed member-chain depth so hostile nesting cannot overflow first.
5. Store spans on AST nodes and parse error diagnostics. Reject leftover tokens and duplicate literal object keys.
6. Add an LRU AST cache of 512 entries keyed by grammar version, parser mode, and source; invalid parses may be cached as errors without retaining root state.

**Acceptance:** `parse.precedence` exhaustive operator-pair matrix; `parse.nullish-mix`, `parse.unicode-bytes`, `parse.depth-128-129`, `parse.strings`, `parse.no-executable-syntax`; fast-check arbitrary text terminates with AST or bounded error.

## T010 Implement evaluator and built-in formatters

**Depends on:** T009. **Sources:** RFC §4; Design §5. **Files:** `expression/evaluate.ts`, `expression/builtins.ts`, `expression/intl-cache.ts`.

1. Evaluate against an injected lexical read interface; return EvalResult plus tracked dependencies and nonfatal missing-value state. Never evaluate generated JS.
2. Implement own-property lookup, null chaining, array indices/length, forbidden computed keys, identity equality, and exact truthiness. Strings expose no methods or `.length`; len supplies length.
3. Implement typed arithmetic/order, zero-division and finite-result checks, boolean/coalescing short circuit, ternary, and the out-of-band failure semantics in C05.
4. Count AST steps/property reads against a single invocation budget. Stop at step 10001 before executing another operation.
5. Implement len, json, number, currency, date. Use string code-unit length for len; object length counts own enumerable keys. Currency uses Intl validation. Date-only input must match an actual Gregorian YYYY-MM-DD date; render its date components without timezone day shift. Timestamp input must be ISO with explicit Z/offset, or a finite epoch-millisecond number; reject ambiguous timezone-less date-times.
6. Cache Intl instances in a bounded 128-entry LRU. Custom formatter output passes safe JSON normalization; promises and side-effectful writes during formatter execution are rejected.

**Acceptance:** `eval.null-missing`, `eval.identity`, `eval.no-coercion`, `eval.short-circuit`, `eval.step-limit`, `format.leap-day`, `format.date-zone`, `format.bad-currency`, `format.async-rejected`, and CSP no-eval tests pass.

## T011 Implement scopes and extension registries

**Depends on:** T008,T010. **Sources:** RFC §§4.2,14. **Files:** `scope/{scope,lookup,declarations,refs}.ts`, `registry.ts`, `public-api/types.ts`.

1. Create scopes with explicit lexical parent and owner links. Register declarations before evaluating any dependent binding.
2. Reject duplicates across all declaration kinds and reserved names. Allow shadowing in child scopes; do not permit same-scope duplicates.
3. Implement refs as lexical names with one live element per name per scope; never return refs as expression values.
4. Build immutable command/formatter/behavior/adapter registries with identifier validation, duplicate/built-in rejection, and adapter version metadata. Freeze at compilation start.
5. Supply component isolation boundaries and context cells for store, route, props, and lifecycle/event values without making them writable.
6. Implement app-scope versus lexical-scope API resolution explicitly; app.refresh cannot reach an arbitrary local resource.

**Acceptance:** `scope.shadow`, `scope.duplicate-cross-kind`, `scope.reserved`, `scope.ref-shadow`, `scope.app-only`, `registry.after-mount`, `registry.builtin`, and `scope.component-isolation` pass.

## T012 Implement owners, ranges, and deterministic disposal

**Depends on:** T011. **Sources:** Design §§3,7. **Files:** `ownership/{owner,index,range,transaction}.ts`.

1. Implement C04 Owner/DomRange and a WeakMap from owned nodes to ownership records. IDs are monotonically increasing per root.
2. Provide createOwner, registerDisposer, createRange, insertRange, moveRange, and disposeOwner primitives. DOM operations use document fragments and comment anchors.
3. Mark the entire disposed subtree inactive before abort callbacks can fire; run cleanup in C06 order and isolate exceptions.
4. Maintain lifetime links for projected content and destination-linked fragment insertion without creating disposal cycles. A disposer token guarantees once-only invocation.
5. Abort owned event listeners, pending postflush work, timers, resource subscriptions, and behavior hooks through the same protocol.
6. Prevent crossing root/ignore boundaries. Add consistency assertions that anchors share a parent and ranges are contiguous before moves.

**Acceptance:** `owner.child-before-parent`, `owner.cleanup-connected`, `owner.double-dispose`, `owner.throwing-cleanup`, `owner.abort-reentrancy`, `range.move-focus`, `range.broken-anchor`, `owner.zero-after-unmount` pass.

## T013 Implement state cells and dependency tracking

**Depends on:** T011,T012. **Sources:** RFC §5; Design §6. **Files:** `state/{cell,dependencies,store,api}.ts`.

1. Instantiate local/store defaults through safe deep copies. State cell source and writability are immutable metadata.
2. Implement synchronous get/set visibility and immutable writes through T008 paths. Increment versions only when a primitive/identity value changes.
3. Record exact path reads during evaluation. Whole-object reads, length/iteration reads, and descendant reads use distinct dependency keys.
4. Invalidate parent replacement descendants; invalidate child writes for child, ancestor whole-object, and iteration readers, while leaving unrelated sibling-leaf readers untouched.
5. Replace dynamic dependency sets after successful evaluation; retain the last safe set on evaluation failure to permit recovery after source changes.
6. Implement batch depth with synchronous callback semantics. Detect a returned thenable and throw BATCH_ASYNC; already synchronous writes remain committed, since batch is not rollback. Always decrement depth in finally.

**Acceptance:** `state.immediate-read`, `state.batch-once`, `state.parent-child-invalidation`, `state.sibling-noop`, `state.branch-dependencies`, `state.async-batch`, `state.disposed-write` pass.

## T014 Implement derived values and flush scheduling

**Depends on:** T010,T012,T013. **Sources:** RFC §§5,15; C06. **Files:** `scheduler/{queues,flush,after-flush}.ts`, `state/derived.ts`.

1. Create per-root deduplicated queues, schedule the first microtask on transition from clean to dirty, and enforce phase order from C06.
2. Evaluate derived values before readers with DFS dependency traversal; keep an evaluation stack and mark only the detected cycle disabled with DERIVED_CYCLE.
3. Preserve last valid values on expression limit failure; normal invalid type results publish null plus diagnostic. Prevent recursive reevaluation loops.
4. Skip work for dead owners and remove disposed jobs from queues. Writes during flush schedule a new pass without recursive flush calls.
5. Implement cancellable afterFlush; tasks run only after all earlier phases in that pass. A postflush write creates another pass.
6. Count complete passes per microtask and stop before pass 101, emitting one UPDATE_LOOP for the root. Unmount remains usable.

**Acceptance:** `scheduler.phase-order`, `scheduler.sync-batch`, `derived.multi-hop`, `derived.cycle-partial`, `scheduler.disposal-mid-flush`, `scheduler.limit-100`, `scheduler.other-root`, `afterflush.cancel` pass.

## T015 Implement browser persistence

**Depends on:** T006,T013,T014. **Sources:** RFC §5; C07. **Files:** `state/persistence.ts`.

1. Compile persistence only on an unambiguous state/store declaration with explicit nonempty key and valid session/local enum.
2. Claim the namespaced key, read the selected Storage object inside try/catch, and validate the envelope/version/value before first derived evaluation.
3. Restore the whole declared object only when it has the same declared top-level keys; wrong/missing/extra keys restore defaults and diagnose. Type evolution is application-managed through namespace version.
4. Coalesce changed declaration snapshots into one JSON serialization/storage write after each settled flush. Do not serialize resources/props/refs or descendants.
5. Storage denial/quota/JSON failures produce nonfatal diagnostics while live state stays committed. Release key claims on disposal.
6. Document and test that session reset does not clear persistence, and no storage-event synchronization exists.

**Acceptance:** `persist.local-session`, `persist.version`, `persist.corrupt`, `persist.quota`, `persist.coalesced`, `persist.key-collision`, `persist.reset-session` pass.

## T016 Implement directive normalization and compile validation

**Depends on:** T004,T011,T012. **Sources:** RFC §§4,16; Design §4. **Files:** `compiler/{normalize,validate,plan,walk}.ts`.

1. Walk DOM nodes and template content explicitly. Map data-ui-* to canonical names while retaining source name/location.
2. Reject duplicate spellings, malformed dynamic-family suffixes, unknown directives, nonempty presence flags, illegal placement, missing companions, and sink ownership conflicts from schema.
3. Treat ui-ignore host attributes normally but do not traverse/observe its descendants. Treat definition/import/route templates as declarations rather than active content.
4. Build a staged BindingPlan per owner with phases for scope, declarations, structure, components, values, events, behaviors, resource start.
5. Separate parse/validate from activate. Invalid local plans retain original HTML and attach no invalid handler; root configuration errors prevent all activation.
6. Capture source templates for later branch/list/component instantiation without mutating inert source content.

**Acceptance:** `compile.data-alias`, `compile.empty-flags`, `compile.unknown`, `compile.ignore`, `compile.conflicts`, `compile.local-fallback`, `compile.declarations-first` pass, with CLI-compatible structured rule IDs.

## T017 Implement root startup and distribution semantics

**Depends on:** T006,T011,T012,T014,T016. **Sources:** RFC §3; C03. **Files:** `core/src/app.ts`, `runtime/src/{classic,esm,module-bridge}.ts`.

1. Discover document ui-app roots only in classic boot after DOM readiness; require unique nonempty names and reject nested roots before any mount.
2. Implement C03 App lifecycle and shared document mount markers; scope all application state/caches/registries to the App.
3. Apply module installers, validate options, discover definitions/imports/routes, compile declarations, evaluate derived, instantiate structures, bind values, activate listeners/behaviors, then start eligible resources.
4. Defer component instances until imports resolve, but allow independent bindings to activate; imported instance failure must not indefinitely delay unrelated content. ready waits for bounded import resolution and initial plan completion.
5. Remove ui-cloak only after that owner's first successful binding flush. Leave failed owner cloak in place with diagnostics; do not claim root-fatal readiness.
6. Implement synchronous idempotent unmount and ready rejection if interrupted during compilation. Stop classic auto-discovery after its initial pass; application-authored additional roots require explicit mount.

**Acceptance:** `boot.classic-auto`, `boot.esm-explicit`, `boot.nested`, `boot.duplicate-name`, `boot.double-distribution`, `boot.same-app-repeat`, `boot.ready`, `boot.unmount-during-import` pass.

## T018 Implement text, property, and attribute sinks

**Depends on:** T010,T014,T016,T017. **Sources:** RFC §§6,16.2. **Files:** `bindings/{text,attribute,class,show,url}.ts`.

1. ui-text accepts primitive/null and uses textContent; reject array/object unless formatted. Do not interpolate ordinary text nodes.
2. Implement the exact bind allowlist; resolve ui-src/ui-href aliases to the same sink. Reject on*, style, srcdoc, data-ui-*, and unlisted names before evaluation.
3. Use DOM properties for value/checked, presence/removal for boolean attributes, string values for other permitted attributes, and removal on null. ARIA false becomes string `false`, not removal.
4. Validate href/src using context URL policy after evaluation and URL resolution; forbidden URL updates remove the unsafe attribute and emit URL_POLICY. Never leave a newly requested unsafe URL installed.
5. ui-class tracks its own tokens and preserves initial static tokens; object values must be booleans. A token static and dynamically false remains present because the framework does not own its static occurrence.
6. ui-show applies RFC truthiness to hidden. Compare previous normalized values and skip equal DOM writes.

**Acceptance:** `bind.text-xss`, `bind.array-requires-json`, `bind.boolean-aria`, `bind.url-schemes`, `bind.static-class`, `bind.noop-write`, `bind.show-preserves-state` pass.

## T019 Implement conditional template chains

**Depends on:** T012,T014,T016,T018. **Sources:** RFC §6; Design §7. **Files:** `structure/conditional.ts`.

1. Group adjacent if/else-if/else templates while ignoring only whitespace text and comments. A non-whitespace sibling terminates a chain; orphan else/else-if is invalid.
2. Reject multiple else branches, branches after else, non-template structural directives, and if+for on the same template.
3. Create one anchored owner range per chain. Evaluate expressions in order and select the first truthy branch; do not evaluate later branch conditions unnecessarily.
4. If selection changes, compile the new branch plan, dispose previous child owner, clone/insert selected content, create its scopes, and activate through scheduler phases.
5. If selection stays the same, preserve existing nodes/state/requests. Empty selection retains anchors only.
6. Invalid branch evaluation retains last successful branch for limit failure; ordinary null/type failure counts false and diagnoses.

**Acceptance:** `if.whitespace-chain`, `if.orphan`, `if.branch-order`, `if.cleanup-once`, `if.same-branch-state`, `if.no-match`, `if.limit-preserves` pass.

## T020 Implement keyed list reconciliation

**Depends on:** T012,T013,T014,T016,T018. **Sources:** RFC §6; Design §7. **Files:** `structure/{for-parser,keyed-list}.ts`.

1. Parse `item[, index] in expression` without splitting inside expression tokens. Validate alias names, collisions, and mandatory ui-key.
2. Treat null as empty; reject non-array values. Evaluate every new key in a temporary read-only item/index scope before changing any live alias or DOM.
3. Require string/finite-number keys and type-preserving Map identity; normalize -0 to 0 because numeric equality considers them equal. Reject duplicate keys atomically.
4. Prepare new owners/plans before mutation. For retained keys update read-only aliases, preserving their local state even when the item object changes.
5. Dispose absent keys, create new anchored item ranges, and move whole ranges into final order using a right-to-left anchor insertion walk. Do not add LIS optimization initially.
6. Keep focus on moved nodes. If the focused node is removed, focus the list's nearest containing element with temporary tabindex=-1 unless focus already moved deliberately during cleanup.

**Acceptance:** `for.typed-keys`, `for.duplicate-atomic`, `for.invalid-key`, `for.reorder-focus`, `for.item-replacement-state`, `for.remove-dispose`, `for.empty`, `for.alias-readonly` pass.

## T021 Implement mutation observation and external DOM changes

**Depends on:** T012,T016,T017,T019,T020. **Sources:** Design §4; C06. **Files:** `compiler/observe.ts`, `ownership/transaction.ts`.

1. Observe each root for childList/subtree and directive-attribute changes; filter ignore descendants without compiling them.
2. Reconcile MutationRecords against transaction journal and final connectivity. Framework insert/remove/move operations must not remount nodes when delivery occurs later.
3. Compile genuinely new app-authored nodes exactly once under the nearest active owner, with declarations and local failure behavior identical to initial mount.
4. For a moved complete owned range within one lexical scope, preserve ownership. Across scopes, dispose old ownership and recompile from source with defaults; do not carry old local state.
5. Diagnose declaration attribute edits as unsupported, retaining the compiled original behavior. Plain static attribute changes remain browser behavior.
6. Dispose disconnected owned nodes/ranges after the observer batch, excluding nodes reinserted safely in the same batch. Abort observation before root teardown.

**Acceptance:** `observe.framework-no-duplicate`, `observe.external-add`, `observe.same-scope-move`, `observe.cross-scope`, `observe.remove-reinsert`, `observe.attribute-change`, `observe.ignore` pass.

## T022 Implement command parsing and safe event snapshots

**Depends on:** T009,T010,T011,T016. **Sources:** RFC §8.1. **Files:** `commands/{parse,snapshot,handler}.ts`.

1. Parse semicolon-separated exact-name calls with optional final semicolon; reject empty interior commands, arbitrary statements, and nested effect calls in expression arguments.
2. Compile set/toggle first arguments as writable paths; all other arguments are pure expression ASTs. Share invocation budget across arguments.
3. Validate DOM event names and `.prevent/.stop/.once/.self`; reject duplicates, unknown modifiers, modifiers on lifecycle handlers, and collision with declarative request trigger.
4. Snapshot only type/key/button/value/checked/detail. Normalize component detail with safe JSON; omit live Event/target/DOM references. Expose null for inapplicable fields.
5. Apply self filtering before prevent/stop/once consumption; prevent/stop occur synchronously during native dispatch. Command execution then awaits sequentially.
6. Register listeners through owner disposal. Once removes the listener on the first eligible event even if the handler later fails.

**Acceptance:** `command.quoted-semicolon`, `command.nested-expression`, `event.self-order`, `event.once`, `event.no-dom-leak`, `event.lifecycle-modifier`, `event.request-conflict` pass.

## T023 Implement core command execution

**Depends on:** T013,T014,T022. **Sources:** RFC §8.1; C04,C09. **Files:** `commands/{execute,builtins,context}.ts`.

1. Implement set and toggle as immediate state writes; wrong boolean/path or expression failure stops the handler before further effects.
2. Implement emit with bubbling/composed CustomEvent from the current host and safely normalized detail; forbid reserved request lifecycle event names as component emissions.
3. Implement focus by lexical ref lookup, wait for flush, require a connected focusable target, and cancel if owner is disposed while waiting.
4. Route refresh/reset/navigate/open/close/toast through registered service interfaces. Missing optional UI/router services produce MODULE_MISSING where required; navigate has native same-origin fallback when router is absent.
5. Invoke custom commands with scoped API/signal/host/refs/event snapshot; await promises sequentially, catch failures, diagnose COMMAND_ERROR, and stop only that handler.
6. Check liveness before invocation and after each await; refuse postdisposal writes through retained context APIs. Do not roll back completed earlier commands.

**Acceptance:** `command.sequential`, `command.reads-prior-write`, `command.stop-on-failure`, `command.module-missing`, `command.focus-after-flush`, `command.async-disposal`, `command.emit-detail` pass.

## T024 Complete root and lexical public APIs

**Depends on:** T011,T014,T017,T023. **Sources:** RFC §14; C03,C04. **Files:** `core/src/public-api/{app,scope,types}.ts`, `tests/types/`.

1. Publish exact method signatures and App.ready/onDiagnostic/inspect clarifications. Restrict mutable operations by lifecycle state.
2. Provide public readonly snapshot types, command/formatter/behavior/adapter contexts, normalized errors, diagnostics, route/resource/action record types, and module installer types.
3. Define rejected/throwing behavior consistently: synchronous invalid API inputs throw a typed PlainUIError carrying code; async work rejects; declarative faults diagnose and localize.
4. Implement scoped afterFlush cancellation and beforeNavigate registration through service interfaces without exposing owner/scheduler internals.
5. Add plain JS examples plus compile-time accepted/rejected TS fixtures for each API. Never require TypeScript in examples.
6. Ensure uninstall/unmount cleans public subscriptions and returned unregister functions remain idempotent.

**Acceptance:** `api.types`, `api.js-usage`, `api.dead-scope`, `api.app-vs-local`, `api.readonly-snapshot`, `api.unregister-twice` pass.

## T025 Close foundation conformance and lifecycle gate

**Depends on:** T015,T018,T019,T020,T021,T024. **Sources:** RFC §18; Design §§15,16. **Files:** `tests/integration/foundation.spec.ts`, `evidence/milestones/M1.md`.

1. Compose nested local state, store persistence, derived chains, if branches, keyed components-as-future-hosts, bindings, refs, and async commands into one fixture.
2. Run 100 mount/update/reorder/unmount cycles with instrumented counts. Require zero framework owners/listeners/timers/queued jobs after every unmount.
3. Reverse branch switches during pending async commands and remove ranges during flush; assert no later writes or double cleanup.
4. Run parser property suite with fixed reproducible seed and at least 10,000 generated strings; save minimized failing inputs as permanent fixtures.
5. Compare classic and ESM outcomes for the entire completed foundation registry subset.
6. Record passing fixture inventory and remaining module placeholders. Do not mark data/forms/components complete from stubs.

**Acceptance:** M1 evidence names exact build and test results; every foundation directive has valid/invalid/disposal coverage; no unresolved foundation blocker remains.
