# Concrete test vectors and reference application contracts

These vectors make the expected outcomes explicit. T005 implements the fixture runner; each owning task expands these minimum cases with the other scenarios listed in its acceptance field. Literal strings below are fixture data, not production credentials.

## V01 Expression values and failures

Use local state `{a:2,b:3,off:false,zero:0,empty:'',obj:{x:7},items:[10,20]}` and standard built-ins. Expected diagnostics are absent unless listed.

| Expression | Expected result |
|---|---|
| `a + b * 4` | number 14 |
| `(a + b) * 4` | number 20 |
| `'a' + 'b'` | string ab |
| `'2' + 3` | null plus EXPRESSION_TYPE; an effect argument must abort |
| `10 / 0` | null plus EXPRESSION_TYPE |
| `off && missing.x` | false, no missing-data error |
| `zero || 9` | 9 |
| `zero ?? 9` | 0 |
| `obj.absent.title ?? 'none'` | string none |
| `items[1]` | 20 |
| `items.length` | 2 |
| `len('abc')` | 3 |
| `obj === obj` | true |
| `{'x':7} === {'x':7}` | false |
| `a == 2` | parser rejection |
| `obj['constructor']` | forbidden-key rejection |
| `window.location` | unavailable identifier diagnostic and no access |
| `off ?? a || b` | parser rejection requiring parentheses |
| `(off ?? a) || b` | 3 |
| `off ? unknownFormatter() : a` | compile rejects unregistered formatter even though branch is inactive |

Limit vectors: UTF-8 source of exactly 16384 bytes may parse; 16385 fails before evaluation. AST depth 128 accepted, 129 rejected. Evaluation step 10001 fails; a previously rendered `old` stays `old`. `ui-on:click="set(a, 'bad' + 1); emit('changed', a)"` changes neither a nor event log.

Date vectors use locale en-US and zone America/Los_Angeles: date-only `2024-01-01` must display January 1, not December 31; timestamp `2024-01-01T00:00:00Z` displays its December 31 local calendar date. Assert formatToParts values rather than locale punctuation that can vary with browser ICU data. `2023-02-29` is invalid.

## V02 Scope and keyed identity

Initial store `{count:100}`, root local `{count:1}`, nested local `{count:2}`. Inner `count` resolves 2, outer resolves 1, store.count resolves 100. `set(count,3)` inside the child changes only child count. A component without prop count cannot read either caller count; `props.count` works only when passed. Projected slot markup still reads caller count.

List starts `[{id:1,label:'A'},{id:'1',label:'B'},{id:2,label:'C'}]` keyed by id. All three keys are distinct. Type into stateful input in numeric key 1, reorder `[2,1,'1']`, and assert same node reference, typed text, and focus for numeric key 1. Replace its item object with `{id:1,label:'AA'}`: label changes but local input state remains. Update to duplicate numeric key 1 twice: old order, alias values, state, and DOM remain unchanged and DUPLICATE_KEY occurs once.

## V03 Resource records

Use fake epoch clock t=1000 and a resource with ui-cache=1000. `empty` is false before a first success. `stale` is false during the initial request. Table columns omit unchanged fields only where stated.

| Transition | data | status | loading | refreshing | error | empty | stale | updatedAt |
|---|---|---|---|---|---|---|---|---|
| Mounted with manual mode | null | idle | false | false | null | false | false | null |
| First request started | null | loading | true | false | null | false | false | null |
| Success null at t=1100 | null | success | false | false | null | true | false | 1100 |
| Explicit refresh at t=1200 | null | success | false | true | null | true | true | 1100 |
| Refresh failure HTTP 503 after final attempt | null | error | false | false | normalized http error | true | true | 1100 |
| Next refresh success `[1]` at t=1500 | [1] | success | false | false | null | false | false | 1500 |
| Clock reaches t=2500 without fetch | [1] | success | false | false | null | false | true | 1500 |
| Required route parameter becomes null | null | idle | false | false | null | false | false | null |

Changing from key A to key B clears A before B loads. Failure of B cannot restore A. Canceling a same-key refresh before completion restores the settled record from before that operation, retaining invalidation/stale state appropriate to the current key generation. An old generation never restores over a newer request.

## V04 Shared request and invalidation timeline

At t=0, resources A and B request the same final URL/headers/adapter/epoch with matching timeout/retry. The server sees one GET. Dispose A at t=10: B is still subscribed, signal is not aborted. Resolve at t=20: only B commits. Dispose both before response in a second run: transport aborts and neither commits.

Cache data accepted at t=0; A TTL=100, B TTL=1000. At t=150 A's cache lookup is stale and revalidates; B's data may be fresh by its own TTL until explicit invalidation. B does not extend A's freshness. Cache identity stays shared. At most one compatible new flight exists.

Start GET generation g=0; successful mutation invalidates key to g=1 before g=0 resolves. Start replacement revalidation g=1. Resolve g=0 after g=1 starts: neither controllers nor cache accepts it. Two explicit refresh calls while g=1 revalidation is current share that result; another mutation advances g=2 and supersedes g=1.

Reset session at authEpoch 2 while adapter.success from epoch 1 is awaiting a barrier. Release barrier: no record/cache/DOM commit. Stores remain as declared until the application's explicit logout reset.

## V05 Action and command ordering

Create one action record and append markers from test hooks. On success expected sequence is: synchronous validation/input snapshot; native prevention; pending=true; request; response/adapter success; pending=false/status=success/data committed; invalidations scheduled; binding/accessibility flush; success commands in source order; finally commands. No error handler runs.

If the second success command rejects, later success commands do not run, COMMAND_ERROR emits, finally runs, and action.status stays success. On explicit replacement cancellation while still mounted, prior success/error do not run; its finally receives canceled=true but cannot settle the new operation. On owner removal, no user finally runs later.

With debounce=100, events at t=0/40/90 produce one operation at t=190 with the last captured values. pending is false through t=189. With drop, a second trigger during pending sends nothing. With replace, a second operation can reach the server before abort of the first is observed; only the second response commits.

## V06 Successful-control serialization

Use this conceptual form in DOM order; click the second submitter. Both upload controls are omitted for the first JSON case.

| Control | Native value/state |
|---|---|
| text `email` | a@example.test |
| number `quantity` | 2 |
| number `optional` | empty |
| checkbox `agree` | checked, value yes |
| checkbox `skip` | unchecked |
| text `tag` | first |
| text `tag` | second |
| text `profile.name` | Ada |
| disabled text `secret` | ignored |
| unnamed text | ignored |
| submit `intent` | draft |
| submit `intent` actual submitter | publish |

Expected JSON body:

```json
{"email":"a@example.test","quantity":2,"optional":null,"agree":"yes","tag":["first","second"],"profile.name":"Ada","intent":"publish"}
```

Expected form-encoded pairs preserve string `2` and empty string for optional, repeat `tag`, and contain no skip/secret/unnamed/draft values. ui-body=`draft` sends only the evaluated draft object and none of these controls. An unselected file input in JSON causes a local validation error and no request. Multipart omits it, but includes a selected zero-byte file named `empty.txt`. GET with any file or default json encoding fails validation; author must choose form encoding and omit file controls.

Server errors `{email:['Already registered','Try another address'],'profile.name':['Too short']}` render only first messages. Editing email clears only email's server errors. Existing aria-describedby=`hint` becomes `hint <generated-error-id>` while invalid and returns to `hint` afterward. Reset restores mounted model values, not arbitrary schema defaults and not unrelated store state.

## V07 Router ranking and traversal

Routes `/products/new`, `/products/:id`, `/files/*rest`, and `*`: `/products/new/` selects literal; `/products/a%2Fb` sets params.id=`a/b`; `/files` captures empty rest; `/missing` selects fallback. `/products/%ZZ` rejects navigation and retains committed DOM.

For `/a/:x/c` vs `/a/b/:y`, `/a/b/c` selects `/a/b/:y` because the first differing segment is literal versus parameter. `/p/:x` and `/p/:y` are ambiguous and fail compilation. Route base `/app` accepts `/app/products` but not `/application/products`.

History entries indices 0,1,2 with committed index=2: Back moves browser to 1; guard=false; correction calls history.go(+1); correction event does not rerun guard; final URL/DOM=index2 and history length unchanged. A newer accepted navigation during old async guard makes old resolution inert. Hash mode parses `#/products/2?q=a&q=b#details` into path `/products/2`, query.q=`['a','b']`, hash=`details`.

## V08 Fragment and disposal vectors

Untrusted body `<div ui-state='{"x":1}'><script>window.pwned=1</script><p onclick="x()" style="color:red">Hello</p></div>` yields ordinary div/p text Hello, no directives/events/style/script, and no expression state. Enhanced action with authorized root may retain ui-state and valid ui-text; it still drops script and inline handlers.

Outer untrusted result `<section><p>new</p></section>` transfers original ref internally; response content need not preserve forbidden directives. Outer enhanced result requires same explicit ui-ref. Two surviving top-level elements fail and leave original target untouched. An unauthorized enhanced ui-import/ui-app fails candidate validation rather than fetching/mounting it.

Action A targets summary at generation1, action B at generation2; resolve B then A: summary remains B. B sanitation/validation failure leaves old summary in place; A still may not commit because it was superseded when B was initiated. A later generation3 can succeed.

Before/after inserted range removed when target is removed, even if its sibling parent stays connected. Inner swap preserves target scope and host behavior, disposes child behaviors once before nodes leave, and does not remount target. Failed candidate preflight starts zero requests/behaviors and changes zero old DOM nodes.

## V09 Application API contract

These are example APIs, never mandatory framework envelopes. Seed timestamps are fixed ISO UTC strings. IDs are strings. Money is integer minor units with currency `USD`; example display converts cents to currency at the display boundary.

Common pagination response is `{items:[...],page:1,pageSize:10,total:3}`. `page` is positive integer default1, pageSize fixed10 for these examples; out-of-range page returns empty items and actual total. `q` filtering is case-insensitive substring on title/name; unknown query keys are ignored. Responses use JSON UTF-8, no redirects, `x-request-id: demo-<monotonic-counter>`.

| Method and endpoint | Request | Identity backend success |
|---|---|---|
| GET /api/articles | q,page query | paged ArticleSummary values |
| GET /api/articles/:id | none | ArticleSummary; 404 if unknown |
| GET /fragments/articles/:id | none | text/html escaped article body |
| GET /api/products | q,page query | paged Product values |
| GET /api/products/:id | none | Product |
| POST /api/orders | CheckoutDraft | 201 Order with authoritative total |
| GET /api/orders/by-client-id/:id | none | Order or 404; reconciliation lookup |
| GET /fragments/orders/:id | none | escaped text/html order summary |
| POST /api/session | `{email,password}` | `{user:User}` plus HttpOnly SameSite=Lax session cookie |
| GET /api/session | session cookie | `{user:User}` or HTTP 401 |
| DELETE /api/session | cookie/CSRF | 204; clears session cookie |
| GET /api/projects | page query/cookie | paged Project values |
| GET /api/projects/:id | cookie | Project |
| PATCH /api/projects/:id | `{name,description}`/cookie/CSRF | updated Project |
| GET /api/projects/:id/activity | page/cookie | paged Activity values |
| GET /api/projects/:id/metrics | cookie | `{labels:['Mon','Tue','Wed'],values:[2,4,3]}` |
| POST /api/uploads | multipart | `{fields:[[name,value],...],files:[{field,name,size,type}]}` |

Types and minimum seed data:

```text
ArticleSummary = {id,title,summary,publishedAt}
  a1: Getting started, Plain HTML first, 2026-01-01T12:00:00Z
  a2: Working with forms, Native controls and HTTP, 2026-01-02T12:00:00Z
  a3: Reusable components, Explicit props and slots, 2026-01-03T12:00:00Z
Product = {id,name,description,priceCents,currency,stock,imageUrl}
  p1: Notebook, Plain paper notebook, 1200, USD, 10, /images/notebook.svg
  p2: Pen, Black ink pen, 250, USD, 20, /images/pen.svg
  p3: Tote, Cotton tote, 1800, USD, 0, /images/tote.svg
CheckoutDraft = {clientOrderId,email,address,items:[{productId,quantity}]}
Order = {id,clientOrderId,email,items:[{productId,quantity,unitPriceCents}],totalCents,currency,status}
User = {id,email,name}
  u1: demo@example.test, Demo User
Project = {id,name,description,updatedAt}
  pr1: Website, Public site redesign, 2026-01-01T12:00:00Z
  pr2: Portal, Customer portal, 2026-01-02T12:00:00Z
Activity = {id,projectId,message,createdAt}
  ac1: pr1, Project created, 2026-01-01T12:00:00Z
```

Image assets above are developer-owned static SVG files displayed through ordinary HTTP image URLs; the fragment sanitizer still rejects inline SVG. Create simple local assets as source-controlled SVG, with no remote images needed.

To make pagination observable, additionally seed products p4 through p23 with name `Sample product <n>`, description `Pagination fixture`, priceCents=`100*n`, currency USD, stock10, imageUrl `/images/notebook.svg`; projects pr3 through pr23 with name `Sample project <n>`, description `Pagination fixture`, and fixed updatedAt `2026-01-03T12:00:00Z`. Sort by numeric suffix ascending before filtering/pagination. Generate one activity for each extra project with ID `ac-<projectId>` and the same fixed timestamp. Do not use random seed values.

Checkout validation: email nonempty containing `@`; address trimmed length>=5; at least one item; each quantity integer1–99; product exists; quantity<=stock; clientOrderId nonempty maximum64. Aggregate duplicate product IDs before stock check. Missing/invalid fields return HTTP422 with literal fields keys (`email`, `address`, `items`, `clientOrderId`). Price/total fields supplied by client are ignored. Server subtracts stock once after validation and stores order by clientOrderId; repeated identical clientOrderId returns existing order without charging/decrementing twice, while different body for same ID returns HTTP409. This is an example backend idempotency feature, not core automatic mutation retry.

Project validation: name trimmed length3–80; description length<=1000. Unknown project returns404; unauthenticated returns401. Append one activity on accepted edit. Tests fix updatedAt using injected server clock, not wall-clock assertions.

Node identity error: `{code:'VALIDATION',message:'Check the form',fields:{email:['Enter a valid email']},requestId:'demo-7'}`. Its explicit example error adapter maps these fields; core identity adapter must not infer this schema.

Python alternate success envelope: `{payload:<same semantic value>,meta:{requestId:'demo-7'}}`. Alternate error: `{error:{type:'VALIDATION',detail:'Check the form',violations:[{field:'email',messages:['Enter a valid email']}]},trace:'demo-7'}`. Register `python-demo` version1 with success→payload and error mapping; preserve HTTP status and core retryability. No adapter bypasses transport content-type/origin/CSRF validation.

Demo session password is the published fixture string `plainui-demo`, valid only on local sample servers. Serving the initial app creates an anonymous in-memory session and CSRF token and injects escaped meta content, so the login POST itself satisfies configured CSRF policy. Successful login rotates the opaque cookie session identifier while retaining that document's CSRF token in the new session; logout issues an anonymous session with the same document CSRF token. All unsafe endpoints validate the token, including login/logout. Full document reload may rotate the CSRF token and emits the new meta value. Logout/session reset tests delay old-session responses. Do not present the demo server as production authentication infrastructure.

Uploads are test-only: return metadata, never execute/store arbitrary uploaded content under the served asset root. Enforce T082 limits identically on both backends. Ordered field and file metadata are asserted within their respective arrays; total mixed part order is captured only by the transport conformance server.

## V10 Required fixture report structure

Every executable fixture emits `{id,buildVariant,browser,commit,passed,assertions,diagnostics,requestCount,lifecycleCounts,seed?,tracePath?}`. A pass requires all expected assertions and no unexpected diagnostics, requests, or remaining work. Save only redacted request metadata; test-only payloads can live in fixture source but are not dumped into production diagnostic snapshots.

The aggregate release report records each RFC registry row, owning task, fixture IDs, latest result, and evidence commit. Missing fixture IDs are pending failures in check-release, not implicit passes.
