# Tooling delivery and release tasks

These tasks are part of 1.0. Passing core tests does not complete the release while examples, browser qualification, security, documentation, or accessibility evidence remains absent.

## T076 Build the static HTML validator

**Depends on:** T004,T009,T016,T047,T054,T068. **Sources:** RFC §§16,18; Design §§4,15. **Files:** `packages/tooling/src/{html-adapter,validate,scope-model}.ts`.

1. Parse UTF-8 HTML with parse5 and source locations; adapt nodes to the shared directive-schema validator without requiring a browser DOM.
2. Traverse native template contents using the same declaration/structural boundaries as runtime. Identify roots, components, imports, routes, scopes, aliases, refs, and form placement statically.
3. Reuse expression/command parsers, prop schemas, route pattern compiler, option validator, and exact allowed/conflicting directive rules. Do not duplicate semantics in independent regexes.
4. Report compile-provable errors for duplicate names/aliases, unknown directives, missing modules declared in CLI manifest, bad patterns, bad literals, unsafe literal URLs, missing props, and invalid ownership combinations.
5. Report warnings for unresolved dynamic values, unknown runtime registrations without a manifest, API response shapes, and adapter behavior. Do not classify uncertainty as a proven runtime error.
6. Resolve local explicit imports inside project root; prohibit implicit network fetch by validator. Map URL paths through supplied asset root, detect cycles, and preserve original file/line/column diagnostics.
7. Return structured diagnostics sorted by file, line, column, code; validation never rewrites input files.

**Acceptance:** `validate.runtime-parity`, `validate.template-content`, `validate.import-cycle`, `validate.dynamic-warning`, `validate.locations`, `validate.no-network`, `validate.no-mutation` pass.

## T077 Expose deterministic CLI validate and build commands

**Depends on:** T003,T076. **Sources:** RFC §2.1; Design §2. **Files:** `tooling/src/{cli,build,diagnostics}.ts`, `docs/cli.md`.

1. Implement `plainui validate <paths...> --root <dir> --manifest <file> --format text|json --warnings-as-errors`. Defaults: root=current directory, format=text, warnings do not fail.
2. Implement directory recursion for `.html` and explicitly listed component files, sorted lexically. Do not read node_modules/dist/hidden directories unless explicitly passed.
3. Exit codes: 0=no errors, 1=validation findings, 2=usage/I/O/config failure. JSON output is one object `{schemaVersion,files,diagnostics,summary}` with no extra stdout noise.
4. Manifest schema: `modules` string array; `registrations` object containing command/formatter/behavior names and adapter name/version pairs; `assetRoot` project-relative directory; `assets` array of extra project-relative application files (including ESM bootstrap files). Missing fields default to empty collections and assetRoot='.'. Reject unknown manifest keys. Without a manifest, unresolved runtime registrations/modules produce warnings rather than invented certainty.
5. Implement `plainui build <entry.html> --out-dir <dir> --modules router,fragments,ui --minify`. Validate first; copy the entry, statically referenced local components/assets, and manifest-listed application assets preserving project-relative paths. Recognize PlainUI script/link references by exact distribution basenames from C02 and rewrite those references to `./assets/<version>/<basename>` in output. Leave other URLs unchanged; reject local asset references escaping project root. Do not transform arbitrary application JS or require compilation for normal usage.
6. Reject output equal to or containing source root; never recursively wipe an arbitrary output directory. Write a staging directory then atomically replace only files listed in previous build manifest, preserving unrelated files.
7. Provide `--help`, `--version`, and Windows path-with-spaces coverage. No create-app/scaffolding feature is required for 1.0.

**Acceptance:** `cli.exit-codes`, `cli.json-stable`, `cli.windows-path`, `cli.build-copy`, `cli.build-no-unrelated-delete`, `cli.invalid-no-output`, `cli.zero-build-independent` pass.

## T078 Generate directive and API references

**Depends on:** T024,T075,T077. **Sources:** RFC §§14,16,18. **Files:** `scripts/generate-reference.mjs`, `docs/reference/`.

1. Generate one directive entry per schema row with canonical/data spellings, kind, placement, default, companions, conflicts, module, valid example, and invalid example.
2. Generate config table with exact defaults and override hierarchy; include schema version and runtime version.
3. Publish manually explained public API pages backed by actual exported TS declarations and type tests; cover ready, diagnostics, inspector, module installation, abort behavior, readonly values, and App vs lexical resolution.
4. Document all stable diagnostic codes with safe example, cause, effect on current output, and concrete remedy. Explain errors versus warnings.
5. Document exact grammar/precedence/truthiness/limits, URL encoding, writable paths, formatter input/output, and command/lifecycle ordering.
6. Make generation idempotent; `check:generated` fails if committed outputs differ from regenerated files. Validate every embedded HTML code sample through T076 where possible.

**Acceptance:** all schema entries appear once, no orphan exports, valid snippets validate, deliberately invalid examples carry expected codes, and generation produces no diff.

## T079 Finalize package exports and zero-build assets

**Depends on:** T075,T078. **Sources:** RFC §3; Design §2. **Files:** runtime/tooling manifests, `scripts/package.mjs`, `tests/integration/package.spec.ts`.

1. Export plainui root ESM/types, router/fragments/ui ESM installers, stylesheet, and schema. Keep internal workspace modules private and inaccessible through documented exports.
2. Emit all C02 classic/ESM filenames from the same versioned source. Use sourceMappingURL references pointing to shipped maps, and include notices for bundled dependencies.
3. Generate SHA-256 and SHA-384 SRI values for every shipped static file; record uncompressed/gzip bytes and toolchain versions in manifest.
4. Pack into local tarballs and install into a new temporary consumer project. Test package ESM imports, plain JS usage, type resolution, CLI executable, and local classic files.
5. Run zero-build HTML from a plain HTTP server with no node_modules/bundler/CDN access and verify optional modules loaded after core before DOM-ready boot.
6. Verify ESM import alone never mounts roots and loading classic+ESM on an already active root fails exactly once without double listeners.

**Acceptance:** `package.exports`, `package.tarball`, `package.integrity`, `package.classic-esm-parity`, `package.zero-build`, `package.no-network-dependency`, `package.types` pass.

## T080 Implement development diagnostics inspection

**Depends on:** T006,T035,T061,T075. **Sources:** RFC §14; Design §14. **Files:** `core/src/diagnostics/inspector.ts`, `examples/diagnostics/`, `docs/diagnostics.md`.

1. Complete inspector snapshot fields: root lifecycle, owner counts by kind, live binding/subscriber/timer/listener counts, pending action count, cache entry count, and redacted resource record metadata.
2. Resource inspection exposes generated ID, status, loading/refreshing/stale flags, updatedAt, and error kind/code/status only. Exclude raw data, URLs with queries, headers, body, messages from backend, and persisted values.
3. Snapshot returns frozen detached data; inspection does not subscribe, trigger fetch, retain DOM, or invoke formatters.
4. Provide a minimal developer example that renders this data as text using public APIs. Do not build an IDE, browser extension, or telemetry service.
5. Verify production debug=false rejects inspection while ordinary diagnostics remain available with safe code/location.
6. Test counters under shared transports and destination-linked fragment ranges so shared objects are counted once and consumers separately.

**Acceptance:** `inspect.redacted`, `inspect.no-side-effect`, `inspect.frozen`, `inspect.production`, `inspect.shared-counts`, `inspect.zero-unmount` pass.

## T081 Define independent backend and sample-data contracts

**Depends on:** T028,T046,T061. **Sources:** RFC §17; Design §15. **Files:** `examples/contracts/{api.json,seeds.json,errors.json}`, `tests/support/backend-contract.ts`.

1. Use the exact endpoint/data shapes in 08-test-vectors. Freeze them as JSON Schema-like fixture contracts without imposing these application envelopes on framework users.
2. Define deterministic seed IDs/prices/content, pagination/query filters, successful/empty responses, validation envelopes, delay/error switches available only to test servers, and request correlation IDs.
3. Define server-authoritative cart/checkout recomputation from product database values; ignore client-supplied prices/totals. Expose an order lookup endpoint for uncertain mutation reconciliation.
4. Provide identity-envelope and alternate-envelope response modes via the two backend implementations and register one explicit adapter for the alternate shape.
5. Keep frontend component sources byte-identical between backend runs; only app-level adapter/baseURL bootstrap configuration may change. Record component file hashes in compatibility tests.
6. Specify cookie-authenticated demo session endpoints and CSRF meta token injection; label demo credentials/data as sample-only and avoid production authentication claims.

**Acceptance:** contract fixture validator accepts all seeded successes/errors and rejects malformed shapes; example requirements map to endpoints with no undefined backend behavior.

## T082 Implement Node and Python fixture servers

**Depends on:** T081. **Sources:** Design §15. **Files:** `examples/backends/node/server.mjs`, `examples/backends/python/server.py`, backend READMEs.

1. Implement the contract independently using Node's built-in HTTP APIs and Python 3.13.7 standard-library http.server; no shared generated request implementation. Sharing immutable fixture data is allowed.
2. Node serves identity JSON bodies; Python serves the alternate envelope/errors mapped by its frontend adapter. Both enforce the same semantic field validation and authoritative prices.
3. Serve root HTML/assets, history fallback only for frontend route documents, JSON APIs, and at least one escaped server fragment endpoint. Correctly distinguish API/asset 404s from route fallback.
4. Implement multipart uploads with busboy 1.6.0 on Node and python-multipart 0.0.32 on Python. Use busboy field/file callbacks and Python parse_form callbacks to collect the ordered field/file metadata defined in 08-test-vectors. Enforce a 2 MiB total request limit, 1 MiB per file, four files, twenty fields, and 1 KiB field values before retaining data; reject limit violations with HTTP 413. See the [busboy API](https://github.com/mscdex/busboy) and [python-multipart API](https://multipart.fastapiexpert.com/api/). Never interpret uploaded filenames as disk paths; store bytes only in temporary test-owned storage.
5. Implement explicit test-only delay/error barriers, deterministic reset endpoint bound to loopback/test mode, and cookie/CSRF/session reset behavior.
6. Add startup flags host/port/data-dir, graceful shutdown, isolated temp storage, and no outbound services. Document one command per server and fixed test ports with collision detection.

**Acceptance:** identical API contract suite passes both servers; only intended envelope differences exist; fragments escape injected user values; servers start/stop cleanly on Windows/Linux.

## T083 Build the public blog reference application

**Depends on:** T068,T079,T082. **Sources:** RFC §17. **Files:** `examples/blog/`, `tests/browser/examples/blog.spec.ts`.

1. Create server-readable article listing and article detail fallback HTML with ordinary links/forms and correct title/meta supplied by backend.
2. Enhance search using query state/resources with loading/error/empty/result views, manual retry, encoded query handling, and safe text rendering.
3. Add client article routes, required fallback, title expressions, and focus/scroll handling while documenting server metadata/HTTP status limitations.
4. Fetch article body through untrusted sanitized HTML fragments; demonstrate rejected inline script/style/directives. Keep article text available without JS in the backend-rendered variant.
5. Extract an imported article-card component with props/slot content. Use same component files with both backends.
6. Document a JSON-only alternative and explicitly state its article content depends on JS. Do not claim arbitrary hydration.

**Acceptance:** keyboard search/detail/back flow passes; JS-disabled article is readable; API failure/empty/fragment attack cases are visible/safe; both backends run unchanged component sources.

## T084 Build the storefront reference application

**Depends on:** T071,T073,T079,T082. **Sources:** RFC §17. **Files:** `examples/storefront/`, `tests/browser/examples/storefront.spec.ts`.

1. Implement product resource/filter/pagination views with imported product-card props and explicit loading/empty/error/stale UI.
2. Declare store.cart items with productId/quantity only, local persistence key/version, and derived display totals from current product data. Label displayed totals estimates until checkout response.
3. Implement add/remove/change quantity via a named custom command using get/set/batch, never mutating readonly snapshots or resource data. Use stable product IDs as list keys.
4. Build checkout native form with typed models, JSON ui-body, server field errors, explicit optional reset, drop concurrency, CSRF, pending state, and order confirmation dialog/toast.
5. Server recomputes prices/stock and returns authoritative total. Simulate client tampering and out-of-stock/error cases. An uncertain network result triggers explicit order-status GET reconciliation before another order attempt.
6. Add order-summary HTML fragment action with target race protection and accessible focus. Exercise same user flow without optional CSS and retain native fallback forms where supported.

**Acceptance:** cart survives reload; reorder preserves item controls; tampered prices are ignored by server; duplicate submit sends one mutation; error values persist; summary sanitization and latest-target-wins pass on both backends.

## T085 Build the authenticated SaaS reference application

**Depends on:** T070,T072,T074,T079,T082. **Sources:** RFC §17. **Files:** `examples/saas/`, `tests/browser/examples/saas.spec.ts`.

1. Create authenticated shared shell, project list/detail parameter routes, pagination query, and required not-found template.
2. Use separate project/detail/activity resources with explicit mutation invalidation names; prove an edit refreshes only declared keys while unrelated requests remain untouched.
3. Build edit form with mapped literal-name server errors, unsaved-change guard, pending/retry displays, and explicit reset. Preserve values on all failures.
4. Add dialog confirmation, manual tabs, and chart behavior using public APIs plus inner ui-ignore. Keep labels and headings meaningful.
5. Implement logout command in exact order: resetSession, clear user-specific store/persistence keys explicitly, call/logout server if necessary via separately authorized app flow, then navigate login view. Ensure old principal responses cannot commit.
6. Provide a visible uncertain mutation outcome and reconciliation GET path; do not automatically replay mutation after authentication/network failure.

**Acceptance:** login/detail/edit/paginate/guard/logout scenario passes; independent invalidation request counts match; old session delayed response is ignored; widget/dialog cleanup passes across routes for both backends.

## T086 Run unchanged frontends against both backends

**Depends on:** T083,T084,T085. **Sources:** RFC §§17,18; Design §15. **Files:** `tests/integration/backend-parity.spec.ts`, `evidence/backend-compatibility.json`.

1. Build frontend examples once and hash HTML/component/JS assets. Run the same build against each server with only documented root config/adapter bootstrap selected.
2. Execute blog, storefront, and SaaS main/failure flows for both envelope variants. Assert semantic DOM/results and API contract behavior, not identical raw JSON envelopes.
3. Verify no server-language-specific directives, component branches, or generated templates are needed for frontend reuse.
4. Run one fragment implementation against the shared sanitization cases and one multipart upload fixture against the transport harness.
5. Capture exact server/runtime versions, frontend hashes, adapter names/versions, test outcomes, and known demo-only limitations.
6. Fail if component files are edited between runs or a backend requires a hidden global API envelope assumption.

**Acceptance:** complete backend matrix passes and evidence proves unchanged frontend/component artifacts.

## T087 Close tooling packaging and examples milestone

**Depends on:** T078,T079,T080,T086. **Sources:** Design §17. **Files:** `evidence/milestones/M5.md`.

1. Validate every example and every imported component with CLI manifest registrations and modules.
2. Smoke-test local static-assets quick start from a fresh directory with network disabled except localhost.
3. Install packed CLI/runtime in a fresh consumer project and execute documented commands on Windows and Linux.
4. Run all three example walkthroughs using published public APIs only, plus chart/editor teardown.
5. Compare schema-generated docs and build artifacts to source; require no stale generated files.
6. Record remaining external qualification work explicitly; working examples do not imply browser/security/accessibility signoff.

**Acceptance:** M5 evidence links passing validator, package, zero-build, examples, and two-backend reports.

## T088 Write complete user documentation and backend recipes

**Depends on:** T078,T087. **Sources:** RFC §§17,18. **Files:** `README.md`, `docs/{quick-start,state,data,forms,components,routing,fragments,extensions,security,migration}.md`.

1. Start quick start with ordinary HTML, local classic script, a state counter, then JSON API resource/action; show all prerequisites for each snippet.
2. Document installation variants, module load order, app.ready, options precedence, scope ownership, expression limits, typed models, successful-control serialization, all lifecycle states, and disposal.
3. Provide complete blog/storefront/SaaS walkthroughs and Node/Python backend recipes with exact commands, request/response bodies, error adapters, and server route fallback configuration.
4. Explain security boundaries: backend authorization, no secrets in persistence, explicit resetSession, uncertain mutation outcomes, CSRF/CORS/redirects, strict CSP/Trusted Types, default untrusted fragments, and developer enhancement trust.
5. Document SEO/progressive enhancement limitations and no generic hydration. Explain why router fallback cannot set a served document's HTTP status.
6. Add draft-syntax consolidation guide for brainstorm forms, clearly labeled unreleased syntax rather than a migration from shipped versions. Add semver policy and security-fix migration process.
7. Run every runnable snippet and command in CI; tag intentionally incomplete excerpts and link a complete example.

**Acceptance:** docs cover every RFC area; complete examples run as written; no optional module or config dependency is omitted from snippets.

## T089 Conduct developer usability verification

**Depends on:** T088. **Sources:** Design §18. **Files:** `docs/research/usability-script.md`, `evidence/usability/`.

1. Prepare three concrete tasks: add a filtered resource list, submit a form with backend errors, and create/import a reusable slotted component. Supply docs and a running fixture backend, not hidden assistance.
2. Ask at least three backend-oriented developers to attempt the tasks. Record actual participant availability; do not fabricate participant results if recruiting is unavailable.
3. Capture time-to-first-working-result, misconceptions, syntax corrections, custom JS needed, and docs consulted. Avoid claiming statistical significance from this sample.
4. Classify defects as documentation gaps, inconsistent diagnostics, missing ordinary capability, or explicit extension cases. Fix docs/diagnostics within existing contract.
5. If a required behavior needs a language/API change, record a specification revision and rerun affected conformance instead of quietly altering syntax late.
6. Publish anonymized findings and exact remaining blocking issues; missing human sessions remain pending evidence.

**Acceptance:** actual observations and resulting changes are recorded; all repeatable task-blocking defects are resolved or explicitly prevent release acceptance.

## T090 Complete cross-cutting security qualification

**Depends on:** T068,T079,T086,T088. **Sources:** RFC §15; Design §§15,18. **Files:** `docs/security/threat-model.md`, `tests/security/`, `evidence/security/review.md`.

1. Document trust boundaries for application markup, JSON responses, developer imports, untrusted fragments, enhanced fragments, adapters/behaviors, storage, and cross-origin requests.
2. Run prototype-pollution tests through JSON parse, props, computed reads, writable paths, query/header maps, error fields, and persistent storage restore.
3. Test redirects, CSRF missing/rotated token, credentials modes, malicious adapter.prepare changes, query/header/body redaction, cache authorization separation, session epoch races, and no default telemetry.
4. Run all sanitizer/CSP/Trusted Types cases and byte-budget checks with the exact production minified builds and pinned dependencies.
5. Audit public extension APIs for postdisposal writes and ownership crossing; review all HTML/URL/attribute sinks and package dependencies using actual advisory data at qualification time.
6. Have a reviewer independent of the main implementation author examine the threat model, sink inventory, and exploit fixtures. Record identity/date/findings; absence of reviewer is pending, not automatic approval.
7. Close every reproducible high-impact issue and add regression fixtures before signoff. Document residual application responsibilities precisely.

**Acceptance:** recorded security review, dependency inventory, CSP evidence, and passing exploit suites; no unresolved release-blocking security defect.

## T091 Run automated accessibility and keyboard tests

**Depends on:** T086,T088. **Sources:** RFC §§13,18. **Files:** `tests/browser/accessibility.spec.ts`, `evidence/accessibility/automated.json`.

1. Scan every principal view/state of the three examples using axe, including loading, empty, error, server field errors, dialog open, tabs alternate panel, and fragment replacement.
2. Fail on violations attributable to framework/example markup; document any tool false positives with reproducible evidence rather than blanket exclusions.
3. Script keyboard-only main workflows with Tab/Shift+Tab/arrows/Home/End/Enter/Space/Escape and assert focus order/visibility.
4. Test 320px viewport, 200% browser zoom, RTL, reduced motion, no optional CSS, and browser high-contrast/forced-colors where available.
5. Verify native labels/ARIA links survive component prefixes, server errors, route changes, fragment swaps, and repeated mount/unmount.
6. Capture screenshots/traces for failing states and rerun only after fixes; automated pass does not complete manual gate.

**Acceptance:** automated scans and keyboard fixtures pass on all example states; report lists exact tool/build/browser versions.

## T092 Complete manual assistive technology review

**Depends on:** T091. **Sources:** RFC §18. **Files:** `docs/testing/manual-accessibility.md`, `evidence/accessibility/manual.md`.

1. Use actual NVDA with a supported Windows browser and VoiceOver with Safari/macOS or iOS. Record exact OS/browser/AT versions and tester; do not substitute an emulated accessibility tree for use of AT.
2. Follow scripted blog search/article, storefront cart/checkout/error, and SaaS edit/dialog/tab/logout flows from keyboard and screen reader.
3. Check announcements of loading/completion/errors, label names, descriptions, invalid fields, focus restoration, hidden panels, dialog name/modal context, and polite toast delivery.
4. Repeat at 200% zoom and narrow/mobile layout; ensure controls remain operable and meaningful content is not clipped.
5. Record pass/fail per step plus reproduction instructions and fixed commit. Recheck failed steps after fixes.
6. If hardware/AT/tester unavailable, leave gate pending with exact missing environment; do not invent evidence or call automated checks equivalent.

**Acceptance:** signed actual manual report covers all three apps and required UI helpers, with no unresolved blocking accessibility issue.

## T093 Qualify actual release browsers

**Depends on:** T087,T090,T091. **Sources:** RFC §18. **Files:** `evidence/browsers/manifest.json`, `docs/browser-support.md`.

1. At RC preparation, consult official vendor releases and record current and immediately previous stable desktop Chromium/Chrome, Firefox, and Safari; current iOS Safari and Android Chrome. Record exact version/build/OS/device and date.
2. Keep Playwright engine CI as fast regression coverage, but run qualification on the actual release browsers; patched Playwright Firefox/WebKit are not proof of branded Firefox/Safari support.
3. Use WebDriver/safaridriver or a pinned external browser lab for unsupported local combinations; record provider/session evidence. Real iOS/Android devices are required for mobile qualification.
4. Execute the complete high-risk browser scenarios: native forms/files/IME, history traversal correction, focus/scroll, dialogs, import parsing, fragment sanitizer, persistence, and module startup.
5. Record unsupported platform APIs and confirm feature behavior matches the RFC; no silently skipped mandatory test. A missing environment is pending.
6. Re-run affected matrix after browser-specific fixes, then freeze the manifest against the release candidate commit.

**Acceptance:** every required actual-browser cell has an evidence link and passes; version numbers are collected at release, not guessed from the planning date.

## T094 Measure bundle size and performance budgets

**Depends on:** T079,T086. **Sources:** RFC §18; Design §16. **Files:** `benchmarks/{manifest.json,keyed-list.html,cold-boot.html,imports.html}`, `scripts/bench.mjs`, `evidence/performance/`.

1. Select and reserve one physical reference machine before beta; record CPU/model/core count/RAM/OS/kernel/browser build, display, power mode, plugged-in state, background workload policy, tool versions, and commit. Do not report invented hardware values.
2. Measure production files with deterministic gzip level 9, mtime=0. Core budget is <=35840 bytes; sum core+router+fragments+UI compressed file sizes is <=71680 bytes, including sanitizer and runtime dependencies. Report ESM/classic independently and gate on the larger delivered variant.
3. Benchmark 1000 keyed list items with actual visible rows and ten existing items changed per update, keeping key/order stable. Force scheduler flush completion as timing endpoint; include JS plus DOM commit, report layout/paint separately from a browser trace.
4. Run 30 warmups, then 200 measured updates per run, at least five runs after page reload. Use nearest-rank percentile (sorted sample index ceil(.95*n)-1); each run's p95 must be <16ms. Report p50/p95 and raw samples, not best run only.
5. Also measure ten-key reorders as a diagnostic and cold boot of 1000 bindings, component import waterfalls, and 100 route transitions. Do not silently replace the fixed hard-gate fixture with an easier operation.
6. If gates fail, profile and fix without removing required functionality/security; otherwise revise RFC budget transparently and retain old/new measurements.

**Acceptance:** reproducible scripts, exact manifest, raw traces/samples, module sizes, and pass/fail calculations published before beta. Goals are not marked achieved until measured.

## T095 Measure lifetime reliability and memory plateau

**Depends on:** T061,T075,T086,T094. **Sources:** Design §16. **Files:** `benchmarks/lifetime.html`, `tests/integration/leaks.spec.ts`, `evidence/performance/lifetime.json`.

1. Instrument owners/listeners/timers/observers/request subscribers/cache entries and run 100 route transitions with components, slots, forms, fragments, widgets, and active requests.
2. After each route disposal require route-local counts return to shared-shell baseline. After root unmount require all framework counts zero and cache<=maxEntries throughout.
3. Collect forced-GC heap samples using a documented browser test protocol every ten transitions after twenty warmups; never expose GC as application API.
4. Define plateau tolerance before measuring: final five post-GC samples may not show >5% or >1MiB growth (whichever is larger) over first five steady-state samples, and retained framework owner/node counts must not grow. This is a plan-selected diagnostic threshold to record in benchmark manifest, not a supplied measured result.
5. Distinguish library/application-retained nodes from framework retention via retainer paths. Fix framework leaks even if aggregate heap remains within tolerance.
6. Repeat full mount/unmount 100 times and test failure teardown (import timeout, sanitizer error, throwing behavior cleanup, interrupted guards) to catch error-path leaks.

**Acceptance:** zero lifecycle counters after unmount, bounded cache, stable retained ownership, documented heap plateau, and no untriaged framework retention.

## T096 Close full conformance and beta gate

**Depends on:** T088,T089,T090,T091,T092,T093,T094,T095. **Sources:** RFC §18; Design §17. **Files:** `scripts/check-release.mjs`, `evidence/milestones/M6.md`, `evidence/requirements.json`.

1. Reconcile every RFC/design clause and C01–C14 decision against 07-coverage and executable fixture IDs. Every directive family requires valid, invalid, lifecycle, and alias cases.
2. Run all suites against minified classic and ESM production artifacts, not just source modules. Include parser property tests, seeded races, CLI parity, strict CSP, actual-browser matrix, and example compatibility.
3. Verify all release evidence references the same candidate commit and locked dependencies; stale reports are not accepted without a documented unaffected-scope justification.
4. Require contract clarifications accepted, no unresolved critical bugs, all required docs/examples delivered, measured budgets passed, and manual security/accessibility evidence present.
5. Build check-release to output a per-gate pass/fail/pending report and exit nonzero for either fail or pending. Do not implement force/ignore-required-gate switches.
6. Publish beta artifacts only after the beta readiness report is complete; optional modules remain mandatory release deliverables.

**Acceptance:** all traceability entries resolved, check-release passes with real evidence, and M6 explicitly distinguishes completed facts from prospective RC steps.

## T097 Prepare release candidate and compatibility record

**Depends on:** T096. **Sources:** RFC §§18,19. **Files:** `CHANGELOG.md`, `docs/release/1.0.0.md`, `evidence/release-candidate.json`.

1. Assign a single `1.0.0-rc.1` version across public runtime/CLI/assets/module bridge metadata; rebuild and pack from a clean checkout using frozen lockfile.
2. Produce changelog describing complete scope, known nonblocking limitations, security properties, supported browsers, and performance reference hardware/results without universal claims.
3. Record accepted spec revision, task/requirement evidence hashes, dependency/license inventory, and exact artifact integrity hashes.
4. Install RC tarballs into fresh zero-build and module consumers and run full example smoke tests, strict CSP, and key browser checks.
5. Freeze behavioral changes after RC; any fix changes version to next RC and reruns affected verification plus release manifest integrity.
6. Document post-1.0 semver rules and vulnerability-reporting contact supplied by maintainer. Do not invent a contact address.

**Acceptance:** reproducible RC artifact set with all matching evidence and explicit limitation notes; no unresolved publishing identity/contact questions hidden in code.

## T098 Verify publishing identity licenses and reproducibility

**Depends on:** T097. **Files:** `LICENSE`, `NOTICE`, `scripts/release.mjs`, `evidence/publish-readiness.md`.

1. Verify actual ownership/availability of planned package names and remote repository. Use maintainer-supplied publisher identity; do not register accounts or reserve names implicitly.
2. Use MIT as the proposed project license, subject to rights-holder confirmation, and preserve dependency license notices. Do not falsely assert copyright ownership on the user's behalf.
3. Configure CI release credentials through secret storage with least necessary publish scope; never commit tokens or expose them in artifact metadata.
4. Rebuild twice in clean isolated directories and compare all artifact hashes, excluding explicitly normalized provenance timestamps. Fix nondeterministic output before release.
5. Run dry-run pack/publish validation, file allowlist checks, source map integrity, exports install tests, and unwanted-file/secret scan.
6. Prepare a concrete release report listing package names/versions, files, hashes, license/identity confirmation, tag, and public destination before any publishing authorization step in the future implementation workflow.

**Acceptance:** publishing prerequisites are facts, not guesses; dry run passes; reproducibility verified; unavailable legal/account ownership remains an explicit external release blocker.

## T099 Publish the complete 1.0 release

**Depends on:** T098. **Sources:** RFC §18. **Files:** final release manifest and evidence.

1. Re-run check-release on final 1.0.0 candidate and confirm accepted public contract, identity, and artifact report. This planning task does not itself authorize publishing future artifacts.
2. When the maintainer authorizes the concrete release, tag the exact tested commit and publish the already verified runtime/CLI packages and versioned static assets through the release job.
3. Upload docs, schema, licenses, integrity manifest, browser matrix, benchmark manifests/traces, and source maps with matching version identifiers.
4. Install from published package endpoints in a clean consumer and fetch versioned static files; compare integrity with prepared manifest and run smoke tests.
5. If postpublication verification fails, stop promotion and issue an explicit corrective patch/notice. Do not silently overwrite immutable published versions or claim complete success.
6. Record artifact URLs, registry versions, tag/commit, verification outcome, and publication timestamp from actual results.

**Acceptance:** all required artifacts published and verified, no module omitted, final evidence references the shipped bytes, and release announcement claims only proven gates.

## T100 Establish maintenance and regression policy

**Depends on:** T099. **Sources:** RFC §18; Design §18. **Files:** `CONTRIBUTING.md`, `SECURITY.md`, `docs/maintenance.md`, CI configuration.

1. Require schema/fixtures/docs updates for every directive/API/default/lifecycle change. Existing behavior changes are major unless correcting a documented security defect.
2. Define dependency update process: exact pin, lockfile, security corpus, browser conformance, size report, and migration note when needed.
3. Preserve regression fixtures for every production bug, minimized property-test failure, and sanitizer advisory fix.
4. Document how to rerun benchmarks on the recorded machine and update browser support evidence for later releases without retroactively changing 1.0 claims.
5. Create a post-1.0 backlog containing excluded features only as future proposals; do not describe them as supported 1.0 features.
6. Document security-report handling and patch publication with clear migration guidance; use confirmed project contacts only.

**Acceptance:** contributors can reproduce validation and release checks, policy matches semantic versioning rules, and 1.0 artifacts/evidence remain immutable and traceable.
