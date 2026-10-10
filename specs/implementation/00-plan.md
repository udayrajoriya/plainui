# PlainUI 1.0 implementation plan

Prepared 10 October 2026 from RFC 0001 revision 0.1 and the companion Technical Design revision 0.1.

This plan defines the complete work required to implement, verify, document, and release PlainUI 1.0. It covers the complete scope of both specifications, including modules that applications may choose not to load. It is an implementation backlog, not a claim that any functionality or release gate already passes.

The repository was inspected before planning. It contains the two source specifications and no implementation, package manifest, test suite, or Git repository. All code paths below are paths to create. The planning documents themselves are the only implementation-related files created by this planning exercise.

## How to execute this plan

1. Read [the implementation contract](01-contract.md) before taking a task. It fixes shared types, algorithms, defaults, and decisions missing from the source documents.
2. Execute tasks in dependency order. A task is eligible only when every listed prerequisite is complete. Numeric order is a valid default execution order.
3. Treat each numbered step within a task as a separately checkable work item. Do not replace detailed steps with a broad interpretation of the task title.
4. Implement the stated behavior, named artifacts, and listed acceptance scenarios together. Use the common fixture format defined in T005. A task is unfinished if its failure or disposal cases are absent.
5. Keep the RFC as authority for existing externally observable behavior. Decisions marked **Plan decision** add precision; decisions marked **Specification clarification** need to be incorporated into the next specification revision in T001. Do not silently change the source contract to match convenient implementation behavior.
6. Record completion evidence in `evidence/tasks/Tnnn.md`: commit identifier, files changed, test command, result, fixture IDs, and any specification revision. Do not mark tasks complete from code inspection alone.
7. If implementation evidence disproves an assumption, record the exact failing case and amend the contract and affected tasks before implementing a different behavior. This is a controlled change, not an invitation to invent semantics while coding.

The plan deliberately does not invent staffing, calendar estimates, release browser versions, hardware measurements, security approval, or assistive technology results. Those are facts to collect using the prescribed procedures. All engineering choices that can be made from the supplied requirements are specified here. No plan can guarantee that debugging or new evidence will require no judgment; the objective is to eliminate unresolved product and architectural choices from ordinary implementation work.

## Reading map

| Document | Contents |
|---|---|
| [01 Contract](01-contract.md) | Toolchain, layout, public APIs, shared records, syntax details, precedence resolutions, security policy |
| [02 Foundation](02-foundation.md) | T001–T025: baseline, schema, tests, interpreter, state, scheduler, compiler, rendering, lifecycle |
| [03 Data and forms](03-data-and-forms.md) | T026–T046: transport, cache, resource/action controllers, commands, models, serialization, form errors |
| [04 Composition](04-composition.md) | T047–T061: components, imports, props, slots, router, guards, history, focus and scroll |
| [05 Fragments and UI](05-fragments-and-ui.md) | T062–T075: sanitizer, Trusted Types, transactional swaps, behaviors, dialogs, toasts, tabs, styles |
| [06 Delivery](06-delivery.md) | T076–T100: CLI, packages, three apps, two backends, docs, qualification, release |
| [07 Coverage](07-coverage.md) | Requirement mapping, directive coverage, lifecycle and security matrices, execution checklist |
| [08 Test vectors](08-test-vectors.md) | Literal input/output expectations, race timelines, form payloads, and reference application API contracts |
| [09 Schema details](09-schema-details.md) | Full source registry, exact sink/fragment allowlists, and stable diagnostic assignments |
| [Task index](tasks.json) | Machine-readable list of all 100 tasks and their dependencies |

## Milestones and exit gates

| Milestone | Tasks included | Exit gate |
|---|---|---|
| M0 Contract and harness | T001–T007 | Contract choices recorded, directive schema complete, shared test harness works, sanitizer size spike recorded |
| M1 Runtime foundation | T008–T025 | Parser/state/rendering fixtures pass; root unmount releases everything; classic and ESM smoke tests agree |
| M2 Data and forms | T026–T046 | Race, cache, epoch, lifecycle, native form, IME, error, and serialization fixtures pass |
| M3 Full composition | T047–T061 | Imports, isolated components, caller slots, guards, traversal correction, title, focus, and scroll pass |
| M4 Fragments and UI | T062–T075 | Sanitizer policy, Trusted Types, atomic swaps, target races, keyboard helpers, responsive CSS pass |
| M5 Tooling and examples | T076–T087 | Validator/build distributions pass; blog, storefront, SaaS, and unchanged two-backend frontend pass |
| M6 Beta qualification | T088–T096 | Complete docs, security/accessibility/browser evidence, performance manifest and lifetime evidence exist |
| M7 Release | T097–T100 | All gates closed, reproducible RC validated, release artifacts prepared and published through the release process |

A milestone is not a smaller definition of 1.0. In particular, stopping at M1 or M2 produces an incomplete prerelease.

## Work ordering

The dependency fields in the task documents are authoritative. The principal path is contract → ownership and expressions → scheduler and compiler → HTTP/forms → components/router → fragments → cross-feature integration → qualification → release. CSS and documentation drafting may proceed once their named prerequisites pass. Early sanitizer feasibility work belongs in M0, before substantial runtime investment; its production integration remains in M4.

No agent delegation or parallel execution is assumed. Independent tasks may be assigned to separate implementers only when their file ownership and dependencies permit it. Shared interfaces change in the contract first.

## Common definition of done

- All steps and acceptance scenarios for the task are implemented; valid, invalid, and teardown paths are covered where relevant.
- Type checking, the affected unit/conformance tests, and relevant real-browser scenarios pass. A change to the shared grammar, schema, lifecycle, or transport also runs every dependent suite.
- Tests assert observable output, state, diagnostics, timing order, and ownership cleanup. Avoid tests that merely repeat function internals.
- No unbounded timers, event listeners, observers, subscriptions, imports, or response completions survive disposal.
- Diagnostics contain no secret headers, query values, request/response bodies, persisted values, or CSRF token contents.
- Generated schema/reference artifacts match their source; public API declarations and documentation match behavior.
- The task evidence record contains actual results, with unavailable external validation explicitly marked pending.

## Release scope exclusions

Do not implement a backend authentication product, database, universal SSR renderer, arbitrary hydration, offline mutation queue, automatic auth replay, optimistic mutation engine, websocket/SSE directive, virtualized grid, collaborative conflict resolver, IDE, or large widget suite. Extension examples may integrate an existing chart or editor through the public behavior API. Do not introduce a VDOM, runtime JavaScript evaluation, Shadow DOM component requirement, runtime package discovery, or mandatory application bundler.

## Source authority

- [PlainUI 1.0 RFC](../PlainUI-1.0-RFC.docx), particularly §§3–16 for behavior and §§17–18 for release scope.
- [PlainUI 1.0 Technical Design](../PlainUI-1.0-Technical-Design.docx), particularly §§3–14 for algorithms and §§15–17 for verification.

External platform documentation is linked at the relevant decision in the contract. Source references throughout the task files use `RFC §n` and `Design §n`; they refer to these supplied revisions, not to an inferred later version.
