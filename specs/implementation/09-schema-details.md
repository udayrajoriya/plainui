# Exact schema and security policy data

This appendix copies the complete RFC registry into the implementation plan and fixes policy tables used by T004. The companion contract states proposed clarifications. When this source registry and an explicitly labeled clarification differ, T001 must record the change in the accepted specification before release.

## Registry source rows

| Attribute | Value kind | Placement and default |
|---|---|---|
| ui-app | Literal name | Application root, required for automatic mount |
| ui-config | Literal element id | Root only, optional |
| ui-state | JSON object | Normal element or component definition template |
| ui-store | JSON object | Root only, empty by default |
| ui-derived | Literal identifier | Empty template; requires ui-value |
| ui-value | Expression | Derived declaration only |
| ui-persist | session or local | State or store owner; absent means memory |
| ui-persist-key | Literal string | Required with ui-persist |
| ui-cloak | Presence | Any owned element; removed after first flush |
| ui-ref | Literal identifier | One element per name per scope |
| ui-ignore | Presence | Element whose descendants have external ownership |
| ui-text | Expression | Element; owns text content |
| ui-bind-NAME | Expression | Element; permitted DOM attribute or property |
| ui-src and ui-href | Expression | URL binding aliases |
| ui-class | Expression | String or boolean class map |
| ui-show | Expression | Boolean coercion; preserves scope |
| ui-model | Writable path | Supported native form control |
| ui-if and ui-else-if | Expression | Structural template only |
| ui-else | Presence | Final sibling branch template |
| ui-for | Loop declaration | Template only; requires ui-key |
| ui-key | Expression | Loop template only |
| ui-data | Literal identifier | Empty resource template; requires ui-get |
| ui-get, ui-post, ui-put, ui-patch, ui-delete | URL template | One method per resource or action |
| ui-load | auto, manual or visible | Resource; auto |
| ui-query | Expression | Request; string keyed map |
| ui-headers | Expression | Request; string map |
| ui-body | Expression | Non GET action; JSON body |
| ui-adapter | Literal registered name | Request; application default |
| ui-credentials | omit, same-origin or include | Request; application default |
| ui-timeout | Positive integer milliseconds | Request; application default |
| ui-cache | Nonnegative integer milliseconds | Resource only; 0 |
| ui-retry | Integer 0 to 3 | GET request; 0 |
| ui-action | Literal identifier | Action record declaration |
| ui-trigger | Literal DOM event name | Action; element specific default |
| ui-concurrency | drop or replace | Action; drop |
| ui-debounce | Nonnegative integer milliseconds | Action; 0 |
| ui-invalidate | Space separated resource names | Mutation; none |
| ui-on:EVENT | Command list | DOM, component or request lifecycle handler |
| ui-encoding | json, form or multipart | Form; json, except GET requires form |
| ui-field-error | Literal control name | Message within an action form |
| ui-route | Literal route pattern | Template; router module |
| ui-outlet | Presence | Exactly one router destination |
| ui-link | Presence | Anchor eligible for router handling |
| ui-title | Expression | Route template; absent preserves title |
| ui-component | Literal hyphenated name | Component definition template |
| ui-props | JSON schema subset | Component definition; empty |
| ui-prop-NAME | Expression | Component instance; typed prop |
| ui-import | Literal same origin URL | Empty component import template |
| ui-response | json or html | Action; json |
| ui-target | Literal reference name | Required for HTML action |
| ui-swap | inner, outer, before, after, append or prepend | HTML action; inner |
| ui-enhance | true or false | HTML action; false |
| ui-use | Space separated registered behaviors | Element; order is declaration order |
| ui-options | JSON object | Behavior owner; same options object to each behavior |
| ui-toasts | Presence | At most one UI notification region per root |

There are 55 source rows. Every row also supports the data-ui spelling. Dynamic families use the suffix policies below.

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
