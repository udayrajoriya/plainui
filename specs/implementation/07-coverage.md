# Requirement coverage and verification matrix

This is the checklist used by T004, T025, T046, T061, T075, and T096 to prevent omissions. A row means work is planned, not already complete. All tasks begin pending. The generated [task index](tasks.json) contains task titles, dependencies, source file, step count, and pending status for importing into an issue tracker.

## Specification coverage

| Source requirement | Primary tasks | Evidence |
|---|---|---|
| RFC §§1–2 full scope and authority | T001,T096–T100 | Accepted baseline and complete release report |
| RFC §3 distribution and startup | T002–T007,T017,T079 | Config, root lifecycle, ready, bundle parity |
| RFC §4 values, expressions, lookup, URLs | T008–T011,T022,T026 | Parser/evaluator/path/query fixtures |
| RFC §5 local/store/derived/persistence | T013–T015 | Reactive graph, cycles, storage cases |
| RFC §6 rendering, structure, refs, ignore | T012,T016,T018–T021 | Sink policy, keyed identity, teardown |
| RFC §7 resources, cache, retry, epoch | T027–T035,T046 | Transport timeline and accepted-token checks |
| RFC §8 actions and commands | T022–T024,T036–T038 | Concurrency/lifecycle/handler ordering |
| RFC §9 models, forms, files, errors, reset | T039–T046 | Real-browser successful-control/IME cases |
| RFC §10 navigation | T054–T061 | Match/guard/traversal/focus/scroll cases |
| RFC §11 components | T047–T053 | Imports/props/slots/ID/instance cases |
| RFC §12 HTML fragments | T062–T068 | Policy/candidate/swap/race/CSP corpus |
| RFC §13 styling/accessibility | T045,T070–T073,T091,T092 | Busy state, keyboard, responsive and AT evidence |
| RFC §14 JS extension contract | T011,T024,T028,T069,T074,T080 | Types, widgets, cleanup, redacted inspector |
| RFC §15 security/operations | T006–T010,T027–T035,T063,T068,T090 | No-eval, origin, CSRF, pollution, CSP, session |
| RFC §16 entire attribute registry | T004,T016,T076,T078,T096 | Row-by-row matrix below |
| RFC §17 three applications | T081–T087 | Blog/storefront/SaaS and two-backend matrix |
| RFC §18 release acceptance | T088–T100 | All actual qualification reports |
| RFC §§19–20 rationale/platform references | T001,T007,T090,T093 | Decision log and platform integration evidence |
| Design §§2–4 architecture/ownership/compiler | T003,T012,T016,T017,T021 | Boundary/observer/disposal suites |
| Design §§5–7 interpreter/reactivity/structure | T008–T015,T018–T025 | Limits, path dependencies, keyed ranges |
| Design §§8–9 data/forms algorithms | T026–T046 | Shared cancellation, generations, serializers |
| Design §§10–11 components/router algorithms | T047–T061 | Projection, history-index correction |
| Design §§12–14 fragments/UI/extensions | T062–T080 | Sanitizer adapter, commit, public APIs |
| Design §§15–16 verification and budgets | T005,T046,T068,T086,T090–T096 | Seeds, exact browser builds, raw traces |
| Design §§17–19 sequence, risks, traceability | T001,T007,T087,T096–T100 | Milestones and release evidence |

## Complete directive registry coverage

There are 55 rows in the supplied RFC registry. Grouped rows below retain their source grouping, but the fixture generator expands every distinct directive and enum separately. Each row requires these four fixture categories: **valid**, **invalid**, **lifecycle**, and **alias parity**. Alias parity tests canonical and data-ui spellings separately and verifies a collision on the same element fails. Dynamic families additionally test allowed/disallowed suffixes.

| RFC registry row | Tasks | Minimum invalid and lifecycle coverage |
|---|---|---|
| ui-app | T017 | Duplicate/nested names; duplicate mount; unmount |
| ui-config | T006 | Missing/wrong JSON block; invalid config leaves unmounted |
| ui-state | T008,T013,T016,T052 | Nonobject/pollution; clone/recreate; component initialization |
| ui-store | T013,T017 | Nonroot/duplicate keys; survives route, ends with root |
| ui-derived | T014,T016 | Bad identifier/placement/cycle; dependency disposal |
| ui-value | T010,T014 | Missing derived owner; limit recovery |
| ui-persist | T015 | Wrong enum/ambiguous owner; storage error; teardown |
| ui-persist-key | T015 | Missing/duplicate/empty; version restore |
| ui-cloak | T017 | Nonempty flag; success removal/failure retention |
| ui-ref | T011,T012 | Duplicate name; lexical shadow; cleanup |
| ui-ignore | T016,T021,T069 | Nonempty flag; descendants never compiled/swapped |
| ui-text | T018 | Object/conflicting owner; update/no markup |
| ui-bind-NAME | T018 | Forbidden sink/suffix; boolean/null/property updates |
| ui-src and ui-href | T018,T026 | Wrong URL schemes; alias/canonical sink collision |
| ui-class | T018 | Invalid class map; static token preservation |
| ui-show | T018 | bind-hidden conflict; retains state while hidden |
| ui-model | T039,T040 | Readonly/file/wrong type; IME and cleanup |
| ui-if and ui-else-if | T019 | Orphan/non-template; branch switch/dispose |
| ui-else | T019 | Duplicate/not-final/nonempty; fallback teardown |
| ui-for | T020 | Bad syntax/nonarray/if collision; keyed reuse |
| ui-key | T020 | Missing/invalid/duplicate/outside loop; atomic rejection |
| ui-data | T033,T034 | Bad/duplicate name/not empty; load/key change/dispose |
| ui-get, ui-post, ui-put, ui-patch, ui-delete | T026–T038 | Each verb; multiple verbs; redirect; cancel/dispose |
| ui-load | T034 | Bad enum/nonresource; auto/manual/visible lifecycle |
| ui-query | T026 | Nested value/nonobject; repeated/omitted keys and reload |
| ui-headers | T027,T031 | Forbidden/wrong value; case override/cache separation |
| ui-body | T027,T036,T041 | GET body/non-JSON; snapshots/serialization replacement |
| ui-adapter | T028 | Unregistered name/bad output; async stale hook |
| ui-credentials | T027 | Bad enum; override and identity isolation |
| ui-timeout | T029,T030 | Zero/noninteger; per-attempt expiration/cancel |
| ui-cache | T032 | Negative/nonresource; TTL/LRU/zero and disposal |
| ui-retry | T030 | Outside 0–3/mutation; backoff abort and final error |
| ui-action | T036 | Name collision; unnamed context and settled record |
| ui-trigger | T036 | Unsupported event/handler conflict; default triggers |
| ui-concurrency | T037 | Bad enum; drop/replace/latest completion |
| ui-debounce | T037 | Negative/noninteger; trailing snapshot/disposal |
| ui-invalidate | T038 | Nonmutation/unresolved name; key-generation refresh |
| ui-on:EVENT | T022,T023,T038,T052 | Event/modifier grammar; sequential/lifecycle/disposal |
| ui-encoding | T041,T042 | GET wrong encoding/files/body; native successful pairs |
| ui-field-error | T044 | Outside action form; field edit/reset/ARIA cleanup |
| ui-route | T054,T058 | Ambiguity/bad pattern; fresh scope per parameters |
| ui-outlet | T055,T058 | Missing/multiple/nonempty; ownership/disposal |
| ui-link | T055 | Nonanchor/nonempty; eligible click vs native navigation |
| ui-title | T059 | Wrong placement/bad expression; title after commit |
| ui-component | T047,T052 | Name/collision/definition placement; instance teardown |
| ui-props | T047,T049 | Invalid schema/default; independent instance values |
| ui-prop-NAME | T049 | Unknown/both forms/type; caller reactive subscription |
| ui-import | T048 | Cross-origin/nonempty/cycle/content; once and abort |
| ui-response | T036,T064 | Wrong mode/resource HTML; json/html parsing |
| ui-target | T064,T065 | Missing/cross-root/ignored; target lifetime |
| ui-swap | T065,T066 | Bad mode/prohibited outer; all six mode lifetimes |
| ui-enhance | T062,T064,T065 | Bad boolean/no root authorization; strip vs compile |
| ui-use | T069,T072 | Missing/duplicate behavior; ordered setup/reverse cleanup |
| ui-options | T069,T071,T072 | Nonobject/schema error; readonly per-factory options |
| ui-toasts | T071 | Duplicate/nonempty; authored/fallback region teardown |

## Configuration coverage

| Configuration field | Default | Tasks and mandatory boundaries |
|---|---|---|
| api.baseUrl | document origin plus `/` | T006,T026; relative/absolute/leading slash |
| api.headers | {} | T006,T027,T031; case-insensitive overrides/redaction |
| api.credentials | same-origin | T027; omit/same-origin/include |
| api.timeoutMs | 30000 | T006,T029,T030; >=1 integer, each attempt |
| api.adapter | identity | T028; registration and version identity |
| api.allowedOrigins | [document origin] | T006,T027; normalized origins/final revalidation |
| cache.maxEntries | 100 | T032; 0/1/100 and LRU |
| locale | en-US | T006,T010; malformed/valid locale |
| timeZone | UTC | T006,T010; invalid zone/calendar date preservation |
| persistence.version | 1 | T015; positive integer/version mismatch |
| router.mode | history | T054–T060; history/hash |
| router.basePath | / | T054–T060; prefix segment boundary |
| security.csrf | null | T027; header/meta nonempty, token rotation/missing |
| fragments.enhance | false | T062–T065; two independent authorization checks |
| debug | false | T006,T080; redacted diagnostics/inspector gating |

Unknown nested keys, incorrect types, config-block placement, programmatic precedence, and endpoint override rules require explicit fixtures. Module installation and ready are programmatic API concerns, not unlisted JSON config keys.

## Lifecycle cross-product

For every row below, run successful completion, error, explicit replacement/cancellation where supported, owner removal, root unmount, and session reset where network data is involved. Test asynchronous work resolving after disposal; merely checking immediate cleanup is insufficient.

| Owner or operation | Resources to release | Tasks |
|---|---|---|
| Root | All scopes, owners, observer, registries, caches, listeners, timers | T012,T017,T025,T095 |
| State/derived binding | Path subscriptions, persistence effect, scheduled work | T013–T015 |
| Conditional branch | Nested owners, commands, requests, behaviors | T019,T025 |
| Keyed item | Alias bindings, local state, full anchored range | T020,T025 |
| Resource | Subscriber, visibility observer, freshness deadline | T031–T035 |
| Action/form | Debounce, request, disable token, error associations, snapshot | T037–T045 |
| Component | Props, nested scopes, slots, IDs, refs, events | T049–T053 |
| Route | Outlet child range, old resources/forms/widgets, pending guards | T056–T061 |
| Fragment target | Candidate, generations, inserted range lifetime links | T064–T068 |
| Behavior/dialog/toast/tabs | Factory cleanup, listeners, timers, focus references | T069–T075 |

## Required security boundaries

| Boundary | Must fail or neutralize | Must remain working |
|---|---|---|
| Expression interpreter | eval/Function/global access/prototype keys/limits | Valid pure subset under strict CSP |
| Writable state | readonly props/resource/route/alias writes; cyclic/class data | Immutable local/store writes |
| Attribute sinks | on*/style/srcdoc/executable URL | Safe text, ARIA, boolean/property behavior |
| Request adapter | changed forbidden origin/header/method; missing CSRF | Allowed normalized draft with fresh token |
| Shared request/cache | epoch/header/adapter-version collision; superseded commit | Compatible GET sharing/partial cancellation |
| Untrusted fragment | directives/scripts/frames/SVG/MathML/styles/URL attacks | Safe text/HTML and outer target identity |
| Enhanced fragment | root/store/route/import/definition creation | Approved local declarations and existing components |
| External component import | cross-origin/redirect/script/style/invalid top level | Same-origin inert definitions/nested imports |
| Debug/inspection | secrets, query values, raw bodies, executable snapshots | Counts/status/location and safe correlation |

## Required release evidence

T096 must reject a release when any item is absent, stale, failing, or merely planned:

- Accepted RFC/clarification revision and source hashes.
- All registry rows with executable valid/invalid/lifecycle/alias cases.
- Classic/ESM parity using shipped minified artifacts.
- Native form/IME/file cases in real browsers.
- Shared-cancellation, generation, invalidation, session-reset, and async-adapter race evidence.
- Actual Safari/Firefox/Chromium and mobile matrix at required versions.
- Sanitizer policy/corpus/version plus strict CSP/Trusted Types report and independent security review.
- Three reference apps, two independent backends, unchanged frontend hashes, chart/editor lifecycle.
- Automated accessibility plus actual keyboard and screen-reader review.
- <=35 KiB core and <=70 KiB combined JavaScript gzip, or transparently accepted numerical specification revision.
- 30 warmup/200 measured keyed updates, p95<16ms on recorded hardware, raw samples/traces.
- Zero owned work after unmount and documented steady-state heap plateau.
- Complete docs, runnable snippets, CLI, package exports, licenses, integrity, reproducibility, and verified publication.

## Execution checklist

Use task IDs as issue IDs or labels. A task is checked off only after its `evidence/tasks/Tnnn.md` exists and its named prerequisites pass. The task index records pending status intentionally; this planning exercise does not complete implementation tasks.

- [ ] M0 T001–T007 contract and harness
- [ ] M1 T008–T025 runtime foundation
- [ ] M2 T026–T046 data and forms
- [ ] M3 T047–T061 composition and routing
- [ ] M4 T062–T075 fragments and UI
- [ ] M5 T076–T087 tooling and examples
- [ ] M6 T088–T096 beta qualification
- [ ] M7 T097–T100 release and maintenance
