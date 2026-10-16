# Fragment and UI tasks

The sanitizer is mandatory for every fragment response, including same-origin responses. Enhanced mode changes which reviewed directives survive; it never authorizes scripts or arbitrary HTML sinks.

## T062 Implement the sanitizer adapter and exact allowlist

**Status:** completed 16 October 2026. [Completion evidence](../../evidence/tasks/T062.md).

**Depends on:** T004,T007,T061. **Sources:** RFC §12; Design §12; C12. **Files:** `packages/fragments/src/{sanitize,policy,tags,attributes}.ts`.

1. Instantiate DOMPurify privately per document; do not mutate an application-owned global sanitizer. Register hooks once and remove instance references on final document release.
2. Configure exactly the RFC tag/attribute lists. Disable default SVG/MathML/custom tags and broad data/ARIA allowances unless routed through PlainUI's explicit attribute predicate.
3. Remove prohibited subtree tags completely; unwrap other unsupported tags retaining safe descendants. Remove inline style/on*/srcdoc/formaction/formtarget/base/metadata content according to policy.
4. Validate href/src/action with T026 URL service in the correct sink mode. Form action must be same-origin; target accepts _self/_blank and _blank forces noopener+noreferrer while preserving other safe rel tokens.
5. Default mode strips every ui-* and data-ui-* before considering ordinary data attributes. Enhanced mode uses the exact C12 directive list plus registered component tags and their validated prop attributes.
6. Sanitize into a DocumentFragment and return sanitation report counts without raw input. Never append the original response string or later serialize into an unsafe sink.
7. Re-run policy validation on the sanitized DOM and nested template content; malformed namespace/parser transformations cannot introduce an unreviewed element after sanitizer traversal.

**Acceptance:** `sanitize.tags-exact`, `sanitize.attrs-exact`, `sanitize.subtree-vs-unwrap`, `sanitize.data-ui-bypass`, `sanitize.urls-encoded`, `sanitize.blank-rel`, `sanitize.form-origin`, `sanitize.namespace` pass.

## T063 Enforce Trusted Types and HTML sink isolation

**Status:** completed 16 October 2026. [Completion evidence](../../evidence/tasks/T063.md).

**Depends on:** T048,T062. **Sources:** RFC §15; C12. **Files:** `fragments/src/html-service.ts`, `core/src/html/template-service.ts`, `tests/security/trusted-types.spec.ts`.

1. Promote T007's proven parsing services into production with private policy handles. Cache a single policy per runtime/document to avoid duplicate-name failures across roots.
2. Keep component import parsing restricted to developer-owned explicit import content and full import grammar validation; keep untrusted parsing inside the sanitizer service.
3. Use DOMPurify DOM-fragment output and DOM node insertion. Reject caller-supplied TrustedHTML as an implicit bypass; it still follows PlainUI policy.
4. Audit source/build for innerHTML, outerHTML, insertAdjacentHTML, DOMParser, createContextualFragment, and Trusted Types policy creation; only reviewed service files may contain parsing sinks.
5. Serve enforced CSP with no inline executable script/no unsafe-eval and explicit policy names. Test core alone, imports, fragments, and full module composition.
6. A policy-creation/CSP failure reports local FRAGMENT_POLICY/import error and leaves old DOM intact. Do not weaken CSP automatically or install a permissive default policy.

**Acceptance:** `tt.core`, `tt.import`, `tt.fragment`, `tt.multiroot`, `tt.blocked-policy-preserves`, `tt.no-extra-sinks` pass; browsers without Trusted Types still sanitize identically.

## T064 Compile fragment actions and arbitrate targets

**Status:** completed 16 October 2026. [Completion evidence](../../evidence/tasks/T064.md).

**Depends on:** T036,T037,T062. **Sources:** RFC §12; C12. **Files:** `fragments/src/{module,target,action-mode}.ts`.

1. Implement installFragments(app), register HTML action response mode, and reject resource HTML mode or missing target ref.
2. Resolve target in initiating lexical scope but enforce same root; reject missing/disconnected/ignored targets and prohibited ownership overlaps.
3. At accepted trigger allocate target generation before async preparation, attach it to action operation, and retain a target lifetime signal. Two different action elements targeting one owner share arbitration.
4. Validate swap enum/default and enhance boolean; ui-enhance=true without root authorization fails before fetch.
5. HTML transport uses Accept:text/html unless explicitly overridden, text/html success requirement, action pending/error state, and no JSON resource mutation.
6. A superseded operation may settle cancellation/finally for its own live action but cannot swap, update target ref, move focus, or revive a disposed target.

**Acceptance:** `fragment.required-target`, `fragment.cross-root`, `fragment.ignore`, `fragment.two-actions-latest`, `fragment.enhance-policy`, `fragment.resource-rejected`, `fragment.target-disposed` pass.

## T065 Prepare detached fragment candidates

**Status:** completed 16 October 2026. [Completion evidence](../../evidence/tasks/T065.md).

**Depends on:** T016,T052,T063,T064. **Sources:** Design §12.2. **Files:** `fragments/src/candidate.ts`.

1. Sanitize response before touching live destination. Build a provisional owner/scope graph that can be discarded without DOM or registry side effects.
2. In untrusted mode perform no directive compilation; all inserted markup stays ordinary inert-to-PlainUI content except the internal transferred target ref for outer mode.
3. In enhanced mode compile allowed bindings/declarations/components against destination scope; reject root/store/route/import/definition/persistence/ui-toasts directives and unavailable modules before commit.
4. Validate ref/name conflicts against retained destination scope, excluding owners scheduled for replacement. Validate static ID conflicts with retained document nodes; duplicates within candidate fail.
5. For outer require one surviving top-level Element, ignoring whitespace/comments, and same explicit ref in enhanced mode or sidecar ref transfer in untrusted mode. Reject roots/outlets/component hosts/active loop ranges/action ancestors.
6. Do not start resource loads, behaviors, listeners, timers, persistence, or user commands while preparing. Release provisional allocations on any failure.

**Acceptance:** `candidate.no-side-effects`, `candidate.ref-conflict`, `candidate.id-conflict`, `candidate.outer-count`, `candidate.outer-untrusted-ref`, `candidate.forbidden-directive`, `candidate.failure-preserves` pass.

## T066 Commit all six swap modes transactionally

**Status:** completed 16 October 2026. [Completion evidence](../../evidence/tasks/T066.md).

**Depends on:** T012,T014,T065. **Sources:** RFC §12; C12. **Files:** `fragments/src/swap.ts`.

1. Recheck owner/action/target generations, epoch, destination connectivity, and ownership restrictions immediately before commit.
2. inner: dispose target child owners, remove children, insert candidate, retain target element/scope/ref/host behavior. outer: dispose target owner, insert one replacement at original position, and register retained target ref identity.
3. append/prepend: insert an owned anchored range at the appropriate child position. before/after: insert sibling range with parent ownership and destination lifetime link. Preserve ordering for sequential accepted insertions.
4. Use one framework DOM transaction so MutationObserver cannot independently mount inserted nodes. Attach candidate owners then activate bindings/listeners/behaviors/resources in normal phase order.
5. If precommit checks fail, discard candidate with old DOM untouched. If unexpected activation throws after disposal, display fixed safe local failure text, emit FRAGMENT_ACTIVATION, settle action error, and keep other root regions usable.
6. Treat completed swap as accepted action success; then run normal invalidation/lifecycle flow if configured for mutation. Never resurrect a disposed old subtree.

**Acceptance:** `swap.inner-owner-retained`, `swap.outer-ref`, `swap.before-after-lifetime`, `swap.append-prepend-order`, `swap.stale-candidate`, `swap.activation-failure-local`, `swap.observer-once` pass.

## T067 Preserve focus and enforce fragment ownership boundaries

**Status:** completed 16 October 2026. [Completion evidence](../../evidence/tasks/T067.md).

**Depends on:** T059,T066. **Sources:** RFC §12. **Files:** `fragments/src/focus.ts`, `tests/integration/fragment-ownership.spec.ts`.

1. Capture active element before commit. If it survives connected and inside permitted ownership, preserve it without focus calls.
2. If removed, focus target/replacement using temporary tabindex=-1 after binding flush; for sibling insertion target remains the focus fallback. Restore temporary tabindex after blur/disposal.
3. Reject swaps into/around router-owned replaceable outlet ranges and component-rendered internals where target ownership would overlap. Explicit component-owned fragment targets are allowed only within its ordinary owned local region, not its host replacement.
4. Validate action-ancestor outer prohibition by owner/DOM ancestry, not selector strings.
5. Dispose destination-linked sibling insertions when destination or route owner is removed. A surviving old action completion cannot recreate them.
6. Show loading/error only through initiating action record; avoid adding unexplained global busy overlays.

**Acceptance:** `fragment.focus-survives`, `fragment.focus-replaced`, `fragment.router-overlap`, `fragment.action-ancestor`, `fragment.sibling-cleanup`, `fragment.no-late-focus` pass.

## T068 Build the fragment security regression suite

**Depends on:** T067. **Sources:** RFC §§12,15,18; Design §15. **Files:** `tests/security/fragments/`, `evidence/security/fragment-policy.json`.

1. Create table-driven positive/negative fixtures for every allowed tag/attribute and every forbidden category, including data-ui-* case/namespace variants.
2. Include encoded javascript URLs, mixed-case schemes, control characters, SVG/MathML namespace confusion, malformed nesting, table foster parenting, template nesting, DOM clobbering IDs/names, and mutation-XSS regression cases compatible with the pinned sanitizer.
3. Execute fixtures in real browsers under CSP with script execution/network beacons instrumented; forbidden payload execution or transmission fails the test even if final DOM looks safe.
4. Verify same-origin content is sanitized, failed HTTP HTML never swaps, and enhanced trust cannot be enabled by response markup itself.
5. Verify sanitized nodes after insertion still satisfy policy, including nested registered components and slot projections.
6. Save exact sanitizer version/integrity/policy hash, test corpus hashes, browsers, and outcomes. Rerun this suite on any dependency/policy change.

**Acceptance:** no forbidden executable effect, policy bypass, late-target commit, or preserved-DOM failure; all corpus cases named in evidence.

## T069 Implement behavior factories and widget ownership

**Depends on:** T024,T052. **Sources:** RFC §14. **Files:** `core/src/behaviors/{compile,mount,context}.ts`.

1. Parse ui-use as ordered space-separated unique names; reject duplicate/unknown names. ui-options is a safe JSON object, not expression text.
2. Invoke factories in declaration order with element, frozen copied options, scoped API, and owner signal, after initial bindings and before eligible network starts.
3. Require optional cleanup function return; reject promises/nonfunction nonundefined returns. If a later factory fails, clean up already-started factories in reverse order and mark that behavior owner failed.
4. Provide afterFlush cancellation, scoped refs/emit/state/refresh, and lifecycle checks. Trusted factory code may retain non-JSON widget objects privately.
5. Enforce documented inner ui-ignore boundary for widgets owning descendants; PlainUI may remove the whole host but never traverse the widget subtree.
6. Cleanup runs once with host still connected, after scope is inactive. Leaked postdispose writes diagnose and are rejected.

**Acceptance:** `behavior.order`, `behavior.options-json`, `behavior.cleanup-on-failure`, `behavior.async-factory-invalid`, `behavior.ignore-widget`, `behavior.postdispose-write` pass.

## T070 Implement accessible native dialog commands

**Depends on:** T023,T069. **Sources:** RFC §13; C13. **Files:** `packages/ui/src/{module,dialog}.ts`.

1. Implement installUI(app) and register built-in service for open/close/toast plus tabs behavior without replacing core command names.
2. open(ref) requires a connected native HTMLDialogElement in lexical root, usable showModal, and C13 accessible name; unknown/wrong targets fail locally.
3. Capture connected opener from activeElement, call showModal, rely on native focus containment/Escape semantics, and track open state per dialog.
4. close(ref) calls native close only when open and restores focus to connected focusable opener after close; a removed opener produces no focus attempt.
5. Handle native close/cancel events consistently. Respect author-canceled cancel events; do not forcibly close a prevented Escape action.
6. Disposal closes/releases controller listeners and focus references without running commands into dead scopes.

**Acceptance:** `dialog.name-required`, `dialog.modal`, `dialog.escape`, `dialog.prevented-cancel`, `dialog.focus-return`, `dialog.removed-opener`, `dialog.dispose-open` pass with keyboard tests.

## T071 Implement text toasts and region lifetime

**Depends on:** T070. **Sources:** RFC §13; C13. **Files:** `ui/src/toast.ts`.

1. Find at most one root ui-toasts region; validate presence flag and C13 options. Otherwise create one root-owned polite live status region and visible list on first toast.
2. Render message with textContent, never HTML; reject object/array message values unless already formatted. Null/empty text does not enqueue.
3. Add unique toast owner, text, native labeled dismiss button, and 5000 ms default expiry; cap visible queue at five with FIFO cleanup.
4. Pause countdown on hover/focus-inside, resume remaining time on exit, and allow duration 0 for configured persistent region. Timers use owner registration.
5. Announce additions politely without reannouncing the whole queue; do not use an assertive global error mechanism.
6. On root unmount remove module-created region, preserve authored region element until normal root disposal, and clear every toast timer/listener.

**Acceptance:** `toast.text-only`, `toast.single-region`, `toast.queue-bound`, `toast.duration`, `toast.pause`, `toast.persistent-dismiss`, `toast.cleanup` pass, with screen-reader behavior reviewed in T092.

## T072 Implement tabs validation and keyboard behavior

**Depends on:** T069,T070. **Sources:** RFC §13; C13. **Files:** `ui/src/tabs.ts`.

1. Validate one descendant tablist, tab elements, corresponding unique tabpanel IDs, aria-controls/labelledby relationships, and no ownership crossing into nested tabs widgets.
2. Validate options; choose first enabled aria-selected=true tab or first enabled tab. Reject multiple initially selected tabs with a diagnostic and use the first in DOM order deterministically.
3. Apply roving tabindex (focused enabled tab=0, others=-1), aria-selected on active tab, and hidden on inactive panels without removing labels.
4. Handle horizontal Left/Right honoring RTL; vertical Up/Down; Home/End; Enter/Space activation in manual mode. Automatic option activates with focus. Prevent default only for handled keys.
5. Skip disabled/aria-disabled tabs. Click activates an eligible native tab control; never convert generic markup into unnamed interactive controls.
6. Observe owned tab additions/removal through lifecycle hooks; active removal uses C13 next/previous fallback. Cleanup restores framework-owned ARIA/tabindex/hidden values and removes listeners.

**Acceptance:** `tabs.manual`, `tabs.automatic`, `tabs.rtl`, `tabs.vertical`, `tabs.disabled`, `tabs.active-removal`, `tabs.relationship-errors`, `tabs.cleanup` pass using keyboard and focus assertions.

## T073 Build optional CSS tokens and responsive primitives

**Depends on:** T003,T004. **Sources:** RFC §13; C13. **Files:** `packages/styles/src/plainui.css`, `examples/style-gallery/`, `docs/styles.md`.

1. Define C13 token values on :root and use low-specificity :where selectors for native typography/buttons/controls. Keep global rules limited to documented baseline styling.
2. Provide ui-stack/ui-cluster/ui-grid/ui-container exactly as C13; document gap/width overrides through tokens and ordinary CSS.
3. Use logical properties for margins/padding/borders, wrapping text and flexible control widths. No fixed viewport heights that hide form content at zoom.
4. Style valid focus outlines, disabled states, field errors and native dialogs without changing semantics. Ensure hidden stays display:none regardless of layout utility rules.
5. Respect reduced motion; any optional transition becomes none under prefers-reduced-motion. No animation is necessary to understand state.
6. Build a gallery at 320/768/1440 CSS pixels, LTR/RTL, 200% zoom, CSS enabled/disabled, and overridden color/space tokens.

**Acceptance:** `styles.hidden`, `styles.narrow-no-overflow`, `styles.zoom`, `styles.rtl`, `styles.reduced-motion`, `styles.override`, `styles.runtime-without-css` pass with visual/manual evidence where appropriate.

## T074 Build chart and editor extension examples

**Depends on:** T046,T061,T069,T073. **Sources:** RFC §§2,14,18. **Files:** `examples/extension-chart/`, `examples/extension-editor/`, `tests/integration/extensions.spec.ts`.

1. Integrate Chart.js 4.5.1 as a chart behavior and CodeMirror 6.0.2 with @codemirror/state 6.7.6 as an editor behavior, using C01's exact example-only pins. Exclude them from framework bundle budgets.
2. Give each widget an inner ui-ignore region and keep its library instance inside factory closure. Pass configuration through JSON options and data through public scope methods.
3. For the chart, render a dataset from resource success through an explicit custom command/afterFlush hook; do not reach into scheduler/controller internals.
4. For the editor, synchronize explicit document state through scoped get/set, avoid feedback loops by comparing strings, and preserve native accessible labels/fallback textarea.
5. Cleanup destroys widget instances, subscriptions, listeners, observers, and afterFlush callbacks before host removal. Simulate pending widget work resolving after route disposal.
6. Document required compatible PlainUI major version and show plain JavaScript registration before mount.

**Acceptance:** chart/editor mount-update-unmount 100 cycles return to baseline with no retained framework/widget listeners; ignored descendants are never compiled.

## T075 Close hybrid rendering and UI milestone

**Depends on:** T068,T070,T071,T072,T073,T074. **Sources:** RFC §§12,13,18; Design §17. **Files:** `tests/integration/hybrid-ui.spec.ts`, `evidence/milestones/M4.md`.

1. Compose a route containing resource product cards, checkout form, HTML order summary target, native dialog, tabs, toast region, and chart behavior.
2. Trigger competing HTML actions, form mutation/invalidation, rapid route changes, and dialog removal during pending work; assert ownership and generation isolation.
3. Run with optional CSS removed to prove behavior correctness is independent of styling. Run default untrusted fragments and explicitly enhanced developer templates separately.
4. Exercise keyboard-only workflow and automated accessibility scan; reserve manual assistive qualification for T092.
5. Measure current complete core and optional gzip bytes, including sanitizer, and compare with both budgets. Report misses immediately; do not remove required features.
6. Record security suite, lifecycle counts, UI keyboard outcomes, and size evidence as M4 gate.

**Acceptance:** all hybrid scenarios pass, zero leaks after unmount, and any budget miss has an explicit unresolved gate or accepted numerical specification revision.
