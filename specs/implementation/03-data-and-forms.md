# Data and form tasks

Use the C08/C09 state machines and generation rules. No HTTP operation may commit merely because its fetch promise resolved successfully.

## T026 Compile and resolve URL templates

**Status:** completed 15 October 2026. [Completion evidence](../../evidence/tasks/T026.md).

**Depends on:** T010,T016,T025. **Sources:** RFC §4.3. **Files:** `packages/data/src/request/{url-template,query}.ts`.

1. Tokenize literal segments and balanced `{expression}` regions using expression string/delimiter rules; do not split braces inside strings/objects. Literal raw unmatched braces fail; `%7B/%7D` stay literal URL content.
2. Reject substitutions in scheme/authority by parsing a sentinel-filled template and determining component positions before evaluation. Validate the final URL again after substitution.
3. Evaluate scalars: encode string/boolean/finite number using encodeURIComponent; null returns an incomplete result; array/object/type/limit failures return an error. Encoded slashes stay inside one substituted component.
4. Resolve requests against api.baseUrl; leading slash uses its origin. Resolve navigation against the document URL through a separate mode.
5. Evaluate ui-query as a safe string-keyed object. Remove every literal query occurrence for a supplied key; append its scalar or array values in insertion order; null omits the key and null array elements are omitted. Reject nested arrays/objects and nonfinite values.
6. Strip request fragments, reject URL userinfo, non-HTTP(S), and origins outside the normalized allowlist. Preserve canonical query pair order as C08 requires.

**Acceptance:** `url.encoded-slash` id=`a/b` becomes `a%2Fb`; `url.null` suspends; `url.query-replace` `/x?q=old&q=older` plus `{q:['a','b']}` yields two new values; `url.authority`, `url.credentials`, `url.protocol`, and `url.relative-base` pass.

## T027 Build immutable request drafts and final policy validation

**Status:** completed 15 October 2026. [Completion evidence](../../evidence/tasks/T027.md).

**Depends on:** T006,T008,T026. **Sources:** RFC §§3,7,8,15. **Files:** `data/src/{request/draft,policy/headers,policy/origin,policy/csrf}.ts`.

1. Define draft fields method, URL, headers, credentials, body, responseMode, timeoutMs, retry, adapter identity, epoch, owner signal, and consumer generation. Body is absent, JSON bytes, URLSearchParams, or FormData.
2. Merge app/endpoint headers case-insensitively; endpoint null deletes an inherited value. Reject non-string non-null header values, invalid header names/values, forbidden browser headers, and Sec-/Proxy- names using a published tested policy table.
3. Set Accept only if absent; set Content-Type for JSON/form; reject explicit multipart Content-Type so the browser can supply its boundary. GET body is always invalid.
4. Run adapter.prepare on a detached draft, then rebuild Headers and validate URL/origin/method/credentials/body again. Do not trust its earlier validated input.
5. After prepare, read the CSRF meta token for same-origin unsafe methods (POST/PUT/PATCH/DELETE). Missing/empty token fails before fetch; override any conflicting supplied header with the current token. Do not send this configured token cross-origin.
6. Freeze metadata after validation; retain transport body in private storage. Omit all body/header values from diagnostics and cache inspection.

**Acceptance:** `request.header-case`, `request.header-null`, `request.forbidden-header`, `request.prepare-origin`, `request.csrf-late-read`, `request.csrf-missing-no-fetch`, `request.cross-origin-no-token`, `request.multipart-boundary` pass.

## T028 Implement adapters and normalized errors

**Status:** completed 15 October 2026. [Completion evidence](../../evidence/tasks/T028.md).

**Depends on:** T011,T027. **Sources:** RFC §§9,14; C04,C14. **Files:** `data/src/adapter/{registry,identity,invoke,error}.ts`.

1. Register identity version 1 automatically; unknown adapter names fail the affected declaration. Custom adapters must have nonempty version strings.
2. Implement prepare/success/error optional hooks and default behavior. Copy/freeze hook context metadata so one subscriber cannot alter another.
3. Normalize failures to all seven error fields. Default messages are fixed safe text by kind/status, fields={}, code/requestId=null unless a safe mapping supplies them, retryable derived from transport rules.
4. Preserve HTTP status for HTTP errors; status=null for network/timeout/security before response. Adapter exceptions become kind=adapter without exposing thrown stack or arbitrary message in production.
5. Normalize success hook output with T008. Validate error-hook output kinds, integer status, strings, field string arrays, boolean retryable; invalid output becomes ADAPTER_ERROR.
6. Liveness/epoch/generation checks run before and after every hook await. Apply C08's separate per-hook deadline; hook expiry is kind=adapter/code=ADAPTER_TIMEOUT and is not retryable. Abort does not become adapter error. Read response bodies only in transport, never again in adapters.

**Acceptance:** `adapter.envelope`, `adapter.validation-map`, `adapter.async-stale`, `adapter.non-json`, `adapter.invalid-error`, `adapter.throw`, `adapter.version-cache` pass with literal expected normalized objects.

## T029 Implement Fetch transport and response decoding

**Status:** completed 15 October 2026. [Completion evidence](../../evidence/tasks/T029.md).

**Depends on:** T027,T028. **Sources:** RFC §§7,8,12,15. **Files:** `data/src/transport/{fetch,decode,response-meta}.ts`.

1. Call browser Fetch with the immutable draft, redirect:'error', credentials, and a linked AbortController. Reject opaque/opaqueredirect responses as security failures.
2. Keep one attempt deadline covering fetch and body consumption; clear it before invoking response adapters, which use their separate C08 hook deadline. Distinguish transport timeout abort from caller/owner cancellation with an explicit reason token.
3. Read successful/failed body once as text. Treat 204 or zero-length 2xx text as null. Whitespace-only JSON text is nonempty and must parse successfully or fail.
4. For nonempty JSON success require media type application/json or `application/*+json`, ignoring parameters/case; parse with JSON.parse then safe-normalize. Wrong media type is parse-kind RESPONSE_TYPE; malformed JSON is parse-kind RESPONSE_PARSE.
5. HTTP non-2xx never becomes success. Parse JSON error bodies only when JSON media type and valid syntax; otherwise supply null parsed body to error hook with safe default HTTP message. Do not render raw error HTML/text.
6. HTML response mode delegates sanitized handling to fragments after text/html validation; no JSON resource receives HTML. Capture correlation header `x-request-id` only as bounded text (maximum 256 characters), never as executable markup.
7. Always clear deadline and abort listeners in finally, including decoding/adapter exceptions.

**Acceptance:** `transport.empty-204`, `transport.empty-200`, `transport.whitespace-json`, `transport.plus-json`, `transport.wrong-type`, `transport.redirect-no-follow`, `transport.body-once`, `transport.abort-vs-timeout` pass.

## T030 Implement attempt retries and cancellation

**Status:** completed 15 October 2026. [Completion evidence](../../evidence/tasks/T030.md).

**Depends on:** T029. **Sources:** RFC §7.2; C08. **Files:** `data/src/transport/retry.ts`.

1. Accept retry count 0–3 for GET; reject retry on mutation directives at validation. Attempts total `1 + retry`.
2. Retry network failures, deadline timeouts, HTTP 502/503/504 only, with delays 500/1000/2000 ms. Do not inspect arbitrary adapter retryable=true to expand this list.
3. Allocate a fresh controller/deadline for each attempt. Check operation signal/epoch/liveness before starting and after delay.
4. Register backoff timer with operation owner; cancellation clears it immediately and resolves operation cancellation, not a timeout error.
5. Preserve only final accepted failure as resource/action error. Intermediate failures do not invoke lifecycle error handlers.
6. Never replay POST/PUT/PATCH/DELETE automatically, including after adapter or timeout failures.

**Acceptance:** `retry.timeline` fourth attempt starts after cumulative delays 3500 ms excluding attempt durations; `retry.no-400-500-parse`, `retry.cancel-backoff`, `retry.per-attempt-timeout`, `retry.mutation-once` pass.

## T031 Implement request keys and shared in-flight GETs

**Depends on:** T028,T030. **Sources:** RFC §7.2; Design §8.1; C08. **Files:** `data/src/coordinator/{key,flight,subscriber}.ts`.

1. Encode cache key fields with length-prefixed canonical segments to prevent delimiter collisions. Digest effective header sequence with the shared SHA-256 service; never use a redacted header list as actual identity.
2. Implement root-local inFlight Map keyed by flight identity; track subscriber ID, owner, generation, key, epoch, callbacks, and active state.
3. Subscribe an eligible GET to an existing compatible flight or create one. Do not deduplicate non-GET methods or incompatible timeout/retry policies.
4. Cancel a consumer by removing its subscription; abort transport only at zero subscribers. A removed subscriber receives no later data/error callback.
5. Before notifying each remaining consumer, require active owner, current generation, matching key, matching epoch, and valid invalidation generation.
6. Delete settled flights even if callbacks throw; isolate subscriber callbacks. Never let old invalidation generations populate settled cache.

**Acceptance:** `flight.shared-count` two resources→one fetch; `flight.partial-cancel` first dispose leaves fetch alive; `flight.last-cancel` aborts; `flight.secret-header-distinct`, `flight.retry-policy-distinct`, `flight.old-generation`, `flight.callback-throws` pass.

## T032 Implement bounded resource cache and invalidation generations

**Depends on:** T031. **Sources:** RFC §7.2; Design §8.2. **Files:** `data/src/cache/{lru,entry,invalidate}.ts`.

1. Maintain per-root LRU Map with data, acceptedAt, adapter identity, epoch, and invalidation generation; never retain errors.
2. On usable read move entry to newest; insertion evicts oldest until size<=maxEntries. maxEntries=0 bypasses retained entries.
3. Calculate freshness per consumer as `ttl>0 && now-acceptedAt<ttl && generation-current`; exact boundary is stale. ttl=0 never reuses a settled entry.
4. Keep resource controllers' own settled values after cache eviction. Cache eviction alone does not clear visible data or refetch.
5. On invalidation advance key generation, mark all attached consumers stale, cancel/supersede older revalidation subscribers, and notify eligible automatic controllers once.
6. Implement coalesced explicit refresh versus new mutation invalidation per C08. Concurrent refresh callers receive the same accepted-generation outcome.

**Acceptance:** `cache.lru-bound`, `cache.zero`, `cache.ttl-per-consumer`, `cache.boundary`, `cache.error-excluded`, `cache.invalidation-old-flight`, `cache.concurrent-refresh` pass with fake clocks.

## T033 Implement resource records and load state machine

**Depends on:** T014,T016,T032. **Sources:** RFC §7. **Files:** `data/src/resource/{record,controller,dependencies}.ts`.

1. Register resource read-only cell before bindings evaluate. Initialize data=null,status=idle,loading=false,refreshing=false,error=null,empty=false,stale=false,updatedAt=null and private hasSuccess=false.
2. On complete new key, clear different-key settled data and advance generation. On incomplete URL, clear previous entity and enter idle without fetching.
3. First fetch sets loading=true,status=loading; same-key fetch after success sets refreshing=true,status=success while retaining data. Both clear error.
4. Accepted success commits normalized data, hasSuccess=true, success status, loading/refreshing=false, correct empty for null/empty string/empty array only, updatedAt=acceptedAt, and freshness-derived stale.
5. Accepted failure retains data only from successful same key, sets status=error/error record, and clears pending flags. Cancellation restores the current generation's last settled snapshot without introducing error.
6. Track URL/query/header dependencies and reevaluate identity when they change. Adapter/header asynchronous work cannot make an obsolete key current.
7. Emit lifecycle handlers through the shared dispatcher only after records and DOM settle; resource declarations support success/error/finally too.

**Acceptance:** `resource.null-success`, `resource.refresh-failure-keeps-data`, `resource.key-switch-clears`, `resource.incomplete`, `resource.late-old-response`, `resource.cancel-restore`, `resource.empty-values` pass against explicit record snapshots.

## T034 Implement resource activation modes and freshness observability

**Depends on:** T033. **Sources:** RFC §7.1. **Files:** `data/src/resource/{activation,visibility,freshness}.ts`.

1. auto resources start after initial bindings and automatically respond to eligible dependency changes. manual resources never initiate without refresh.
2. visible resources observe the declaration template's nearest containing Element, excluding disconnected/template-content-only targets. Diagnose missing/unobservable parents.
3. On first intersection, disconnect that resource observation and permanently behave as auto until disposal. Scope visibility state does not reset on ui-show hiding.
4. Use the earliest positive TTL deadline among live consumers to schedule a shared root timer that updates stale flags; reschedule when consumers/entries change. No automatic fetch solely from expiry.
5. Invalidation refreshes active auto and already-visible consumers; marks manual/not-visible consumers stale. Explicit refresh works for all modes.
6. Stop visibility observers/timers on disposal and avoid registering a new observer from a late callback.

**Acceptance:** `load.manual`, `load.visible-first-only`, `load.visibility-target`, `load.hidden-stale-no-fetch`, `load.explicit-hidden-refresh`, `load.ttl-stale`, `load.dispose-observer` pass.

## T035 Implement session reset and public resource refresh

**Depends on:** T024,T034. **Sources:** RFC §7.2; Design §8.2; C08. **Files:** `data/src/session.ts`, `data/src/resource/public.ts`.

1. app.resetSession increments epoch before touching controllers; abort resource/action/import-related authenticated operations where applicable, clear flights/cache, reset resource/action records to idle.
2. Prevent old async prepare/success/error hooks and fragment candidates from committing under previous epoch. Static component definition imports are not authenticated resource data; root unmount still aborts them.
3. Preserve declared local/store/persisted state and explain this in the logout example.
4. Implement lexical and app-scope refresh resolution; reject unknown names/read-only nonresource names synchronously or through command diagnostics as appropriate.
5. A refresh promise resolves only after next accepted data and binding flush. Failure rejects normalized error; disposal/supersession/session reset rejects AbortError; incomplete URL rejects RESOURCE_SUSPENDED.
6. Ensure resetSession does not start fresh requests with credentials being cleared; subsequent explicit refresh can restart.

**Acceptance:** `session.epoch-first`, `session.late-adapter`, `session.idle-records`, `session.preserve-store`, `refresh.await-bindings`, `refresh.manual`, `refresh.incomplete` pass.

## T036 Compile action declarations and action records

**Depends on:** T016,T022,T033. **Sources:** RFC §8. **Files:** `data/src/action/{compile,record,context}.ts`.

1. Distinguish resource template from action by ui-data. For action require one method, validate method-specific options, and select submit/change/click default trigger.
2. Resolve ui-trigger only from supported DOM events; reject duplicate request and ui-on same-trigger binding on that element.
3. Create optional named read-only action cell in nearest lexical scope plus `$action` context for action element descendants. Initialize pending=false,status=idle,data=null,error=null.
4. Compile URL/query/headers/body once into AST plans; do not send anything during compilation. Register no listener if the action configuration is statically invalid.
5. Validate form encoding/defaults and lifecycle handlers before activation; delegate forms to T042–T045.
6. HTML action options require fragments module/target/swap and cannot appear on a resource. JSON actions reject target/swap/enhance options.

**Acceptance:** `action.default-trigger`, `action.method-conflict`, `action.name-collision`, `action.unnamed-context`, `action.body-get`, `action.missing-module`, `action.invalid-native-fallback` pass.

## T037 Implement action debounce and concurrency

**Depends on:** T030,T035,T036. **Sources:** RFC §8; C09. **Files:** `data/src/action/controller.ts`, `forms/src/pending.ts`.

1. Accept eligible triggers into the C09 preparation/debounce pipeline; cancel/restart trailing timers with newest captured input.
2. At operation start increment generation, establish epoch/signal, set pending/status, clear prior error, and apply pending affordances.
3. For drop, ignore triggers while pending without changing data or timer. Disable native form submit buttons with original-state+operation tokens; for nonnative custom trigger hosts use aria-disabled and event suppression.
4. For replace, cancel prior consumer/transport subscription at new operation start, permit old finally only while scope active, and forbid old completion from clearing the new pending flag or reenabling its controls.
5. On settlement restore only framework-owned disabled/aria-busy/aria-disabled values if their token still matches. Preserve controls already disabled by application state.
6. On dispose cancel timers, operations, and pending affordances without user lifecycle commands. Document that client abort cannot undo a server mutation.

**Acceptance:** `action.drop-double`, `action.replace-reversed`, `action.debounce-snapshot`, `action.debounce-dispose`, `action.disabled-original`, `action.old-completion-token`, `action.unknown-server-outcome` pass.

## T038 Implement action settlement and lifecycle handlers

**Depends on:** T023,T032,T037. **Sources:** RFC §§7.2,8.1; C09. **Files:** `data/src/action/{settle,lifecycle,invalidation}.ts`.

1. Commit pending=false plus status/data/error in one state transaction before handlers. Preserve last successful same-action data on failure; expose latest normalized failure separately.
2. On successful non-GET mutation, resolve all ui-invalidate names lexically, collect distinct resource keys, advance each once, and schedule active automatic subscribers before success handlers.
3. Flush records/DOM/accessibility, then run success or error; protect finally so it executes even if the preceding handler throws/rejects.
4. Build lifecycle scope with result/error/action/event/canceled values. For cancellation, skip success/error and run finally only if owner remains active.
5. Keep accepted HTTP success successful when a command or invalidation resource fails; surface those failures through their own diagnostics/records.
6. For unnamed action, lifecycle context still uses its own record. One bad invalidate name diagnoses without rerunning an already successful mutation.

**Acceptance:** `lifecycle.order` logs `record,invalidation,DOM,success,finally`; `lifecycle.error-finally`, `lifecycle.command-failure`, `lifecycle.cancel-finally`, `lifecycle.disposed-none`, `invalidate.shared-key`, `invalidate.refresh-shared` pass.

## T039 Implement text and numeric model controls

**Depends on:** T013,T018,T036. **Sources:** RFC §9. **Files:** `forms/src/model/{compile,text,number,composition}.ts`.

1. Validate writable path, supported control type, and conflicting bind sinks. Reject file inputs and non-controls for ui-model.
2. Text/textarea controls use input; maintain per-control composition flag, suppress writes from compositionstart through intermediate input, and commit once at compositionend.
3. Number/range use valueAsNumber and raw empty detection; empty→null, finite valid→number, invalid text→retain model and set a framework-owned validity message. Clearing/reentering valid text clears only that message.
4. Initial state writes to controls after persistence; later model updates change DOM only when normalized values differ. Preserve selection/caret and active IME text.
5. Do not dispatch synthetic input/change from programmatic updates. Register native listeners and validity cleanup with owner.
6. Type-changing bound input attributes must reselect the supported adapter safely; changes to/from file type are diagnosed and model binding disabled for that control.

**Acceptance:** `model.text-input`, `model.ime`, `model.number-empty`, `model.number-invalid`, `model.no-synthetic-events`, `model.caret`, `model.file-rejected` pass in actual browsers.

## T040 Implement checkbox, radio, and select models

**Depends on:** T039. **Sources:** RFC §9. **Files:** `forms/src/model/{checkbox,radio,select}.ts`.

1. Checkbox model requires boolean and uses checked on change. Reject array-checkbox-model conventions; they are not in this RFC.
2. Radio groups bind strings and synchronize by name/form ownership plus bound path; only checked radio change writes value. Diagnose inconsistent paths within the same modeled group.
3. Single select binds the selected string; multiple select binds selected option strings in DOM order, including no selection as empty array.
4. Model updates check matching radio/options and never synthesize events. Unmatched radio string unchecks the group; unmatched single-select string sets selectedIndex=-1.
5. On dynamic option/control addition run normal binding synchronization; removal releases registrations. Preserve static labels and native disabled semantics.
6. Record form-owned model paths for T043 reset snapshots once controls have initial normalized values.

**Acceptance:** `model.checkbox-boolean`, `model.radio-string`, `model.radio-group-error`, `model.multiselect-order`, `model.no-selection`, `model.dynamic-options`, `model.cleanup-group` pass.

## T041 Implement successful-control form serialization

**Depends on:** T008,T027,T039,T040. **Sources:** RFC §9. **Files:** `forms/src/serialize/{successful-controls,json,urlencoded,multipart}.ts`.

1. Build a successful-control sequence using native form association, disabled fieldset semantics, checked/radio state, select options, and actual submitter. Include externally associated controls and preserve document order.
2. Feature-test FormData(form, submitter); compatibility path inserts submitter pairs at their native position, not blindly at end. Include image-submit coordinate fields from the captured click or zero coordinates for keyboard submission.
3. JSON mode groups repeated literal names into arrays, converting only number/range controls to finite numbers/null. One occurrence stays scalar; checkboxes serialize their value string, never model boolean.
4. Reject every File in JSON, including the placeholder File of unselected file input. For multipart omit only unselected placeholder files; preserve explicitly selected zero-byte files using filename/selection metadata.
5. Form encoding preserves native string values in URLSearchParams; multipart preserves FormData order/files and never manually sets boundary.
6. GET forms require form encoding and no files/body; merge their pairs into query with same-key replacement semantics. Explicit ui-body bypasses control serialization entirely and requires JSON encoding.

**Acceptance:** `form.submitter`, `form.external-control`, `form.disabled-fieldset`, `form.literal-dots`, `form.repeated`, `form.number-json`, `form.checkbox-value`, `form.empty-file-json-error`, `form.multipart-empty-vs-zero-byte`, `form.get-query` pass.

## T042 Implement native form validation and submit interception

**Depends on:** T037,T041. **Sources:** RFC §§8,9. **Files:** `forms/src/{validation,submit}.ts`.

1. Observe the actual submit event and SubmitEvent.submitter; respect form novalidate and submitter formnovalidate. Use native validity checks/reportValidity where validation is required.
2. Invalid form: focus the first invalid control according to native form order, do not set pending, do not prepare an adapter, and do not fetch.
3. Valid enhanced form: synchronously capture submitter/model/control data, prevent native navigation, and hand snapshot to action scheduling. A later failure never invokes native submit.
4. A synchronous serialization/URL/security preparation error produces a local action error and no transmission, with preserved user values.
5. If static compilation rejected enhancement, leave native action/method behavior available. Prevent duplicate enhancement from both submit listener and submit-button click listener.
6. Test Enter-to-submit, requestSubmit, multiple submitters, and user edits during debounce. Direct form.submit() retains native bypass behavior and is documented as such.

**Acceptance:** `submit.required`, `submit.novalidate`, `submit.formnovalidate`, `submit.enter`, `submit.actual-button`, `submit.prepare-reject-no-replay`, `submit.native-invalid-config` pass using request counters and navigation observers.

## T043 Implement explicit form reset snapshots

**Depends on:** T015,T040,T042. **Sources:** RFC §9. **Files:** `forms/src/reset.ts`.

1. After state/persistence/initial models resolve, capture immutable values for each distinct model path in the form. Deduplicate shared radio paths and overlapping parent/child paths deterministically by keeping the broadest captured path once.
2. Register snapshots by form owner/ref. Newly mounted modeled controls capture their path at their own initial mount if the form has no existing snapshot for it.
3. reset(ref) resolves a form lexically, invokes native reset, then batches restoration of captured paths and clears field errors/owned validity state.
4. Honor a canceled native reset event by not restoring models/errors. Observe ordinary reset buttons and programmatic form.reset() through the same handler without recursion.
5. Native file reset remains browser-owned. Do not refetch resources or reset unrelated state/action success data.
6. Dispose snapshots when the form owner is removed; remounted forms capture new defaults.

**Acceptance:** `reset.persisted-defaults`, `reset.only-bound-paths`, `reset.native-file`, `reset.canceled`, `reset.radio-once`, `reset.no-refetch`, `reset.remount` pass.

## T044 Implement server field errors and accessibility associations

**Depends on:** T028,T038,T042,T043. **Sources:** RFC §9. **Files:** `forms/src/errors/{index,presenter,aria}.ts`.

1. Associate ui-field-error with its nearest action form and literal name; outside-form placement fails. Index all matching successful or unsuccessful controls by name, including external form-associated controls.
2. On normalized failure render the first string in fields[name] through textContent; keep the full array in the error record.
3. Create stable document-unique presenter IDs when missing. Append their IDs to matching controls' aria-describedby while preserving existing tokens. Apply owned aria-invalid=true and remember prior values.
4. Editing a field clears only that field's server-error entry and associated presenter/owned ARIA; retain other fields and global error message. A new accepted submit clears the prior error record.
5. Cleanup restores only attributes/tokens still owned by the framework, preserving author changes made in the meantime.
6. Provide a form-summary pattern for unrecognized fields/global errors in docs/examples; no automatic popup or unsafe server markup.

**Acceptance:** `error.literal-name`, `error.first-message`, `error.aria-preserve`, `error.edit-one-field`, `error.new-submit-clear`, `error.unmatched-summary`, `error.cleanup-owned-only` pass plus axe checks.

## T045 Integrate request accessibility state and form lifecycle

**Depends on:** T034,T038,T044. **Sources:** RFC §§9,13. **Files:** `data/src/request/accessibility.ts`, `tests/browser/forms.spec.ts`.

1. Define busy region: an action element itself; for resource template its nearest parent element. Maintain a per-element count so one request completion cannot clear aria-busy while another is active.
2. Preserve preexisting aria-busy values and restore only framework-owned changes. Include preparation/transport pending, exclude trailing debounce wait.
3. Apply disabled token logic to form-associated submit buttons, including external controls; do not disable fields needed for accurate snapshots before serialization.
4. Verify failure preserves controls/file selection/models and success does not reset unless reset command is present.
5. Combine server field errors, ui-body nested model, invalidation, success reset, and finally cleanup in one browser workflow.
6. Confirm no implicit global completion/error notifications; announcements come from authored live markup or explicitly invoked UI helpers.

**Acceptance:** `a11y.busy-count`, `a11y.busy-restore`, `form.failure-preserves`, `form.success-no-reset`, `form.explicit-reset-order`, `form.external-submit-disabled` pass.

## T046 Close data and form race conformance

**Depends on:** T035,T038,T045. **Sources:** RFC §18; Design §15. **Files:** `tests/integration/data-forms.spec.ts`, `evidence/milestones/M2.md`.

1. Generate seeded schedules of at least 500 cases combining dependency changes, response order, adapter delays, refresh, mutation invalidation, disposal, and session reset.
2. Assert every accepted commit has current owner/generation/key/epoch/invalidation tokens; expose test-only token events without exposing them as public APIs.
3. Include two subscribers with TTL 0/1000, two with timeout 100/1000, success=null, cache eviction during refresh, and invalidation during backoff.
4. Test drop/replace with server mutation recorded even after client abort; require UI reconciliation example to GET before retrying a nonidempotent action.
5. Run full native form/browser matrix and classic/ESM parity. Require zero active transport subscriptions, timers, and event listeners after root unmount.
6. Record fixture failures as blockers; do not substitute unit test coverage percentages for these cases.

**Acceptance:** complete M2 evidence with recorded seeds, request timelines, form browser outcomes, and zero-leak assertions.
