# PlainUI Version 1 RFC

*Full public specification for the 1.0 release*

RFC 0001 • Revision 0.1 • 10 October 2026 • Status Proposed

## 1 Purpose and decision status

PlainUI is a general purpose frontend framework for backend developers. It makes ordinary web applications possible with HTML, declarative attributes and HTTP APIs, while retaining CSS and JavaScript as deliberate extension points. This RFC specifies the complete 1.0 target, including optional modules that must be ready before that release. It is not a prototype or phase one specification.

The product direction is established: supercharged HTML, backend independence, JSON API first behavior, optional server rendered HTML fragments, reusable HTML components, local and shared state, optional default styling, and an optional JavaScript escape hatch. The exact syntax, runtime rules, defaults, limits and packaging below are proposed decisions for review. Accepting this RFC would freeze them as the 1.0 contract; a draft does not imply that a runtime already exists or that release gates have passed.

The companion PlainUI Version 1 Technical Design explains implementation choices. This RFC governs externally observable behavior if the documents disagree. MUST, MUST NOT, SHOULD and MAY denote required, prohibited, recommended and optional behavior for a conforming implementation. Application code is responsible for backend authorization and business rules.

## 2 Product scope and principles

PlainUI must support public content sites, storefronts and shopping carts, SaaS workflows, communities, customer portals and interactive applications. Admin dashboards are one use case. Maps, rich editors, charts, video and drag and drop must integrate through JavaScript without replacing the rest of the application.

Developers start with ordinary HTML and a static runtime asset. A bundler, Node server, JSX, TypeScript, proprietary backend, special API envelope and code generation are not required. Advanced projects may use modules and build tools. The same components and HTML must work with any backend that can serve the required HTTP responses.

The core concepts are pages, state, resources, actions and components. Expressions describe values; commands describe effects. The framework must make loading, stale data, errors, cancellation and disposal observable. Implicit network behavior must have precise defaults.

### 2.1 Complete release scope

| Area | Required by version 1.0 |
| --- | --- |
| Runtime | Zero build distribution, explicit roots, lifecycle, scoped bindings, deterministic disposal and diagnostics |
| State | Local and shared JSON state, derived values, immutable server resources, optional browser persistence |
| Rendering | Text and attribute bindings, conditions, keyed lists, model bindings and formatting |
| HTTP | JSON resources, mutations, headers, credentials, adapters, timeout, cancellation, deduplication and cache invalidation |
| Forms | Native validation, typed serialization, field errors, files, pending state and explicit reset |
| Navigation | Ordinary links plus optional client routing, parameters, query state, history and navigation guards |
| Components | HTML files, explicit imports, typed props, slots, events, local state and composition |
| Fragments | Explicit HTML mode, sanitized swaps, ownership boundaries and optional trusted enhancement |
| User experience | Optional styles, responsive tokens, accessible dialog, tabs and notification helpers |
| Extension | Stable JavaScript commands, formatters, behaviors, adapters and documented lifecycle APIs |
| Delivery | CLI validation and packaging, documentation, three reference applications, cross browser and security conformance |

### 2.2 Boundaries of version 1.0

PlainUI does not implement backend authorization, a database, a universal server renderer, collaborative conflict resolution, an offline mutation queue, a new UI language, an IDE, or a large application widget suite. WebSocket and SSE clients, optimistic business mutations, virtualized grids and complex editors are possible through extensions; declarative versions are not core 1.0 promises. SEO and initial content may use any backend renderer. Generic hydration of arbitrary server component output is outside 1.0.

“Optional” means an application need not load the module. The router, fragment module and accessible UI helpers remain required deliverables for the 1.0 release. The core alone must remain useful.

## 3 Distribution and application startup

The release provides plainui.js as a self contained deferred classic script exposing window.PlainUI, plainui.mjs as an ES module, separate router, fragments and UI modules, and optional plainui.css. Versioned static assets and package exports must expose the same public behavior. No unversioned CDN dependency is required.

```html
<link rel="stylesheet" href="/assets/plainui.css">
<script src="/assets/plainui.js" defer></script>
<main ui-app="shop">
  <section ui-state='{"count":0}'>
    <p ui-text="count"></p>
    <button ui-on:click="set(count, count + 1)">
      Add one
    </button>
  </section>
</main>
```

The classic script mounts each ui-app after DOM readiness. The module distribution mounts only through PlainUI.mount(root, options). Loading both on the same root is an error. Root names must be unique within the document; nested roots are forbidden. Other document regions are untouched. Modules and registrations must complete before a root mounts. Missing required modules cause a diagnostic and disable only the affected feature.

A JSON configuration block may be referenced by ui-config="config-id" on the root. The referenced element must be a script with type="application/json" in the document. It is inert configuration, never executable code. Programmatic options override block values, which override defaults. Unknown keys are validation errors. Endpoint level settings override application defaults only where specified below.

The runtime compiles the root before enabling its declarative event handlers, establishes scopes and declarations, evaluates derived values, mounts structural content, applies bindings, then starts eligible resources. ui-cloak is removed after the first successful binding flush. An invalid root configuration leaves the root unmounted; a local invalid binding leaves its ordinary HTML in place and emits a diagnostic. A page should provide meaningful fallback HTML where practical.

### 3.1 Configuration contract

| Field | Type and default | Meaning |
| --- | --- | --- |
| api.baseUrl | String, document origin plus slash | Base for relative HTTP endpoint strings |
| api.headers | String map, empty | Application headers; endpoint map wins case insensitively |
| api.credentials | omit, same-origin or include; same-origin | Fetch credentials mode |
| api.timeoutMs | Integer at least 1; 30000 | Per attempt timeout |
| api.adapter | Registered name; identity | Success and error normalization |
| api.allowedOrigins | Array of origins; current origin | Request destination allowlist; redirects rejected |
| cache.maxEntries | Integer at least 0; 100 | Per root memory cache bound |
| locale | BCP 47 string; en-US | Formatting locale |
| timeZone | IANA string; UTC | Date display zone |
| persistence.version | Positive integer; 1 | Browser state storage namespace version |
| router.mode | history or hash; history | Used only when the router is loaded |
| router.basePath | Absolute path; slash | Prefix removed before route matching |
| security.csrf | null or object; null | Same origin unsafe request token policy |
| fragments.enhance | Boolean; false | Authorizes enhancement of developer owned fragments |
| debug | Boolean; false | Detailed development diagnostics |

The csrf object has header and meta fields, both nonempty strings. Before each unsafe same origin request, the runtime reads content from the document meta element whose name equals meta and sends it under header. Missing tokens fail the request before transmission when this policy is enabled. Cross origin CSRF policies belong in a request adapter. Secrets are never supplied as long lived public configuration.

## 4 Attribute language and values

The canonical spelling is ui-*. Every attribute also accepts data-ui-* with identical semantics. Both spellings on the same element for the same directive are invalid. Names and enum values are lowercase unless explicitly stated. ui-on:click and data-ui-on:click are equivalent. Declarative templates use native template elements so their content remains inert until instantiated.

Values are one of five kinds: literal, JSON, expression, URL template or command list. The attribute registry specifies the kind. The runtime must not guess that a literal is an expression. Text between normal HTML tags is not interpolated. ui-text inserts textContent, never markup.

### 4.1 Expression grammar

Expressions support null, true, false, finite decimal numbers, single or double quoted strings, arrays, objects with literal string keys, parentheses, identifiers, dot access, bracket access, unary ! and -, arithmetic + - * / %, comparisons < <= > >=, strict equality === and !==, boolean && and ||, null coalescing ?? and ternary ? :. Operator precedence follows JavaScript for this subset. Mixing ?? with && or || requires parentheses. No loose equality, assignment, increment, bitwise operators, regular expressions, templates, constructors, functions or general method calls are allowed. Expressions and command lists are limited to 16 KiB UTF-8 each, 128 AST nesting levels and 10000 evaluation steps per invocation; exceeding a limit emits EXPRESSION_LIMIT and preserves the last valid output.

Identifiers match [A-Za-z_$][A-Za-z0-9_$]*. Member access reads own properties of JSON objects or array indices and length; a missing value returns null. Access to __proto__, prototype and constructor is rejected at all depths, including computed keys. window, document, globalThis and unregistered functions are unavailable. Object values have no executable prototype semantics. Null member access yields null. Arrays and objects compare by identity; primitives use strict type comparison. All nonempty strings, nonzero finite numbers, arrays and objects are truthy; null, false, zero and empty strings are false. Undefined is normalized to null at integration boundaries.

Arithmetic requires numbers except + also accepts two strings. There is no implicit cross type coercion. Division by zero, nonfinite results and incompatible operand types emit EXPRESSION_TYPE and return null. Type errors must not trigger effects. Missing data may therefore be rendered with a fallback such as event.data.title ?? 'Loading'.

Pure calls are allowed only to named registered formatters and the built ins len(value), date(value), number(value), currency(value, code) and json(value). len accepts strings, arrays and objects; object length counts own keys. date accepts ISO 8601 dates or timestamps and uses configured locale and zone. Date only strings retain their calendar day; timestamps represent instants rendered in the configured zone. number and currency accept finite numbers. json serializes JSON values. Invalid formatter inputs return null with a diagnostic. Custom formatters must be synchronous and side effect free.

### 4.2 Lookup and ownership

Names resolve from the nearest lexical scope outward to the application scope. ui-state, resources, derived declarations and loop aliases share one namespace per scope; duplicate names are errors. store, route, props, $event, $action, $result and $error are reserved. Shared values are accessed as store.cart; route.params.id and route.query.q are read only router values. props exists only inside a component. Local declarations cannot overwrite reserved names.

Component instances create isolated local scopes. Their template cannot implicitly read caller local state; it may read props, application store and route. Projected slot content retains the caller scope. A keyed loop creates one scope per item. A ui-state element creates a child scope for itself and its descendants. A declaration on that element is visible to its other attributes.

### 4.3 URL templates

HTTP and navigation URL attributes accept literal text plus {expression} substitutions. Literal braces are written as %7B and %7D. Each substituted scalar is percent encoded as one component, including slashes. Null suspends a resource and prevents an action with a diagnostic; arrays and objects are errors. Templates cannot substitute into the scheme or authority. Query maps supplied by ui-query use URLSearchParams semantics: arrays create repeated keys, null omits a key, and scalars become strings. Endpoint query keys replace same named literal query keys.

Relative request paths resolve against api.baseUrl. A leading slash resolves from the base origin; absolute URLs require an allowed origin. Navigation URLs resolve against the document URL. The final URL is validated after substitution and normalization. Only HTTP and HTTPS requests are accepted. Link bindings additionally allow mailto, tel and same document fragments; image bindings permit HTTP and HTTPS only in core 1.0.

## 5 State and derived values

ui-state contains a JSON object whose keys become local writable bindings. Values are initialized once per mount, deep copied per component or loop instance, and reset when that scope is disposed and recreated. ui-store contains a JSON object on the application root; it lasts for the root lifetime and survives client route transitions.

ui-derived="total" with ui-value="expression" defines a read only computed value in the nearest scope. Derived declarations belong on empty template elements. The runtime tracks reads, batches synchronous writes into one microtask flush and recomputes affected derived values before dependent DOM bindings. Reads in subsequent commands see earlier writes immediately. Cycles produce DERIVED_CYCLE and disable the cycle; they must not loop indefinitely.

set(path, expression) writes a declared local or store path; toggle(path) requires a boolean. Writes cannot target resources, props, route values or loop aliases. Array replacement through set is supported. Complex edits use registered commands and the same store API. Server resources change only through their resource controller or an adapter result.

ui-persist="session" or "local" on an element with ui-state or ui-store persists that declaration only. ui-persist-key is required and unique for that origin and application. Each write serializes the entire declared object; browser storage failures are nonfatal diagnostics. Keys are namespaced by root name, explicit key and persistence.version. Invalid JSON or a version mismatch restores defaults. Persistence is opt in, contains no API cache, and provides no cross tab synchronization guarantee. Applications must not persist credentials or sensitive server data by default.

## 6 Rendering and structural directives

ui-text binds a primitive as text; null is an empty string. Arrays and objects require json or a formatter. ui-bind-NAME sets an allowlisted attribute or property. Boolean attributes use presence for true and removal for false. Null removes other attributes. value and checked use DOM properties. ui-src and ui-href are aliases for ui-bind-src and ui-bind-href. Event handler attributes, srcdoc, style and arbitrary HTML insertion are not bindable.

ui-class takes an expression producing a string or an object of class names to booleans. Framework owned class tokens are updated while static tokens are preserved. ui-show toggles the hidden property without disposal. Authors must not override hidden with CSS. ui-if, ui-else-if and ui-else appear on adjacent sibling templates; whitespace and comments may intervene. Only the selected branch is mounted. Switching branches disposes the previous branch. A standalone conditional uses ui-if alone.

ui-for="item, index in expression" appears on a template; the index alias is optional. The expression must be an array; null acts as empty. ui-key is required and evaluated in the item scope. Keys must be unique string or finite number values with type preserved. A duplicate or invalid key rejects that list update and retains the previous DOM. Reordering preserves nodes and item local state by key; removal disposes them. ui-if and ui-for on the same template are invalid; nesting makes order explicit.

ui-ref="name" registers an element reference in its current scope for commands, behaviors and fragments. References are not expression values. ui-ignore marks a subtree owned by another library; PlainUI must not compile or observe inside it. Runtime generated changes must not cause duplicate mounts.

## 7 Resources and JSON API behavior

A resource declaration is an empty template with ui-data="name" and ui-get="URL". It creates a read only resource record. JSON is the default and only core resource response mode. HTML uses fragment actions instead. No global envelope is imposed; identity mapping returns the full parsed JSON value. An adapter may unwrap data and normalize errors.

```html
<template ui-data="event"
  ui-get="/api/events/{route.params.id}">
</template>
<p ui-show="event.loading">Loading event</p>
<p role="alert" ui-show="event.error !== null"
   ui-text="event.error.message"></p>
<h1 ui-text="event.data.title ?? 'Event'"></h1>
<button ui-post="/api/events/{route.params.id}/book"
  ui-action="booking"
  ui-on:success="refresh('event'); toast('Booked!')">
  Book ticket
</button>
```

### 7.1 Resource record

| Field | Contract |
| --- | --- |
| data | Last successful normalized JSON value; null before first success |
| status | idle, loading, success or error |
| loading | True while a first value is pending and no successful value exists |
| refreshing | True while a new request is pending after any successful response |
| error | null or normalized error from the latest accepted failure |
| empty | After success, true only for null, an empty array or an empty string |
| stale | True when previous data exceeds its freshness time or is invalidated |
| updatedAt | Epoch milliseconds of last accepted success, otherwise null |

A new request clears error. If prior data exists, status stays success during refresh; after refresh failure status becomes error and data remains. A successful JSON null is a valid successful value and differs from never loaded through updatedAt. An aborted request creates no error and restores the last settled state. A timeout is an error. Rendering errors never rewrite server data.

Resources automatically load on mount and reload when dependencies of URL, query or headers change. ui-load="manual" disables automatic loads; ui-load="visible" observes the template's nearest parent element and waits for its first intersection before becoming automatic. An unobservable parent produces RESOURCE_VISIBILITY_TARGET; provide a wrapper element. Default is auto. Dependency changes that make a required value null set the resource idle and clear data from the previous request key to avoid showing a different entity. Values from a previous key must never be treated as the current key's stale data.

### 7.2 Request and cache rules

ui-cache is a nonnegative freshness duration in milliseconds; default 0. Zero disables reusable settled cache entries but permits in flight GET deduplication. Cache identity includes root, authentication epoch, adapter name and version, method, canonical URL including query, credentials and effective request headers. Freshness is evaluated per declaration against the shared acceptedAt time; a longer TTL on another subscriber does not override a shorter one. Non GET actions are never cached or deduplicated. The cache is memory only and bounded by least recently used eviction. Errors are never cached. The runtime must not persist authorization headers or include them in diagnostics.

Mount uses a fresh cached value without a request. An expired value may be shown with stale=true while one revalidation starts. refresh('name') bypasses freshness, invalidates that key and initiates a GET. ui-invalidate="products cart" on a successful mutation invalidates resources resolved by those names and refreshes active automatic subscribers. Manual and not yet visible subscribers become stale without being fetched. No endpoint relationships are inferred. Logout or principal change must call app.resetSession(), which aborts requests, clears all resource caches and advances the authentication epoch.

Requests have monotonically increasing generations per consumer. A newer request cancels the consumer's old subscription; the old response must never commit even if transport cancellation fails. A shared transport is aborted only after its last subscriber releases it. Component disposal, route disposal and root unmount release all subscriptions. GET retry is controlled by ui-retry, an integer 0 to 3, default 0; attempts after the first wait 500, 1000 and 2000 ms respectively. Retry applies to network failures, timeouts and HTTP 502, 503 or 504 only. Each attempt has its own timeout. No mutation retries occur automatically.

## 8 Actions and event commands

An element without ui-data may declare exactly one of ui-get, ui-post, ui-put, ui-patch or ui-delete. The default trigger is submit on form elements, change on select elements and click elsewhere. ui-trigger may override this with one supported DOM event name. Enhanced form submission prevents native navigation synchronously after validation and synchronous input preparation. Async adapter or transport failure then becomes an action error; it must not replay native submission. GET actions are one shot commands, not resource declarations.

ui-action="save" declares a read only action record in the nearest scope with pending, status, data and error fields. Status is idle, pending, success or error. $action exposes that record to bindings on the action element and its descendants even when unnamed. Resources and action names cannot collide. Mutation success requires a 2xx response and valid response parsing. HTTP 204 or an empty 2xx body resolves data to null. Nonempty JSON responses require application/json or a +json media type. Parse and content type failures are normalized errors. The request module must reject redirects; applications use explicit navigation commands rather than redirecting API responses.

ui-body is an expression returning a JSON value for non GET requests. If absent on a nonform action, no body is sent. GET bodies are invalid. ui-headers is an expression returning a string map; null values omit a header. ui-credentials and ui-timeout override application defaults. Accept defaults to application/json, or text/html for fragments. JSON bodies use Content-Type application/json. Forbidden browser request headers cannot be set.

Each action element uses ui-concurrency="drop" by default: a trigger while pending is ignored. "replace" aborts the prior client request and accepts only the newest completion. Cancellation does not undo a server mutation. Native submit buttons are temporarily disabled during the default drop operation, preserving their original disabled state; custom controls must expose aria-disabled and suppress duplicate triggers. ui-debounce is a nonnegative trailing delay in milliseconds, default 0; it applies before scheduling the request. No automatic queued or optimistic mutations are included.

### 8.1 Commands and handlers

ui-on:EVENT contains semicolon separated command calls, with quoted strings and nested expression delimiters parsed structurally. Supported DOM events are click, input, change, submit, keydown, keyup, focus, blur and registered component events. on:success, on:error and on:finally are reserved request lifecycle handlers. They execute in that order as applicable after the resource or action record is committed and its DOM bindings flushed; finally runs on success, failure and cancellation. A cancellation runs neither success nor error. $result and $error exist only in lifecycle handlers. $event exposes a safe snapshot of type, key, button, value, checked and detail; no DOM object is exposed in expressions.

Commands run sequentially and await returned promises. Failure stops that handler, emits a command diagnostic and still permits finally. A successful HTTP response remains successful if a later command fails. The request pending flag clears before success or error handlers run. Finally runs for cancellation only while its scope is still active; disposal forbids all later user commands. Event modifiers .prevent, .stop, .once and .self may be appended to DOM handler names; they are invalid on lifecycle handlers. Passive listener behavior is not exposed in 1.0. Duplicate declarative request and ui-on handlers for the same trigger on one element are invalid; completion handlers are allowed. ui-trigger accepts the DOM event names enumerated in this section.

| Command | Required behavior |
| --- | --- |
| set(path, value) | Write an assignable state path synchronously |
| toggle(path) | Negate a declared boolean |
| refresh('resource') | Invalidate and await the next accepted resource request |
| reset('formRef') | Run the form reset behavior including model restoration |
| navigate(url) | Use the router if eligible, otherwise normal same origin navigation |
| emit('name', detail) | Dispatch a bubbling composed CustomEvent from the current host |
| focus('ref') | Focus an existing referenced focusable element after DOM flush |
| open('dialogRef') | Open a native dialog using the UI module |
| close('dialogRef') | Close that dialog and restore focus |
| toast(message) | Announce and display a text notification through the UI module |
| Registered command | Resolve by exact name and invoke with evaluated arguments |

Command names are unique per root; extensions cannot replace built ins. set and toggle first arguments are writable syntax paths, not evaluated values. Reference and resource names resolve lexically. If a required optional module is absent, commands fail with MODULE_MISSING. Async commands receive an abort signal and must not write after their scope is disposed.

## 9 Forms and validation

Forms use their native action and method for fallback plus a declarative HTTP method for enhancement. HTML required, pattern, min, max and input types remain the first validation layer. Native validation must run before pending state or a network request. An invalid form focuses the first invalid control and sends nothing. novalidate retains its HTML meaning. PlainUI does not invent client business rules from API schemas.

ui-model="path" binds a declared writable state path. Text fields use input, selects and checkboxes use change, and composition text is not committed until compositionend. A checkbox binds a boolean, same name radios bind one string, and a multiple select binds a string array. Number and range inputs bind finite numbers, empty numeric inputs bind null, and invalid numeric text is rejected with field validity feedback. Other controls bind strings. File inputs cannot bind a JSON model. Programmatic model changes update the DOM without synthetic input events.

For a form without ui-body, ui-encoding defaults to json. Only successful named controls and the actual submitter are serialized. Disabled, unchecked and unnamed controls are omitted. Repeated names become arrays in DOM order. Names are literal keys; dots and brackets do not create nested objects. A single checkbox contributes its value string when checked; model booleans do not change native form serialization. Number controls become numbers or null; other successful controls become strings. Any File in JSON encoding is an error, including an unselected file input; choose multipart or omit that control. Empty unselected file controls are omitted in multipart mode.

ui-encoding="form" uses application/x-www-form-urlencoded; "multipart" uses FormData and lets the browser set its boundary. Both preserve native string values. GET forms append serialized successful values to query parameters, cannot send files, and require form encoding. ui-body may instead supply a nested JSON object and then requires json encoding. It must not silently merge with control serialization.

```html
<section ui-state='{"draft":{"email":""}}'>
  <form action="/api/subscriptions" method="post"
    ui-post="/api/subscriptions" ui-action="subscribe"
    ui-ref="subscribeForm"
    ui-body="draft"
    ui-on:success="reset('subscribeForm')">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required
      ui-model="draft.email">
    <p ui-field-error="email"></p>
    <button type="submit">Subscribe</button>
  </form>
</section>
```

The normalized error object is {kind, status, code, message, fields, retryable, requestId}. kind is network, timeout, http, parse, validation, adapter or security; status is an HTTP integer or null; code and requestId are strings or null; fields is a map from literal field name to string array, default empty. Messages are rendered as text. Adapters map backend validation envelopes to this shape; PlainUI never assumes a specific 422 response schema. ui-field-error="name" renders the first error for that field from the enclosing action form, sets aria-invalid on matching controls, and links the message with aria-describedby. Unmatched errors belong in a form summary.

Editing a field clears that field's server error; a new submit clears the prior error object. Failed submissions preserve all user values. Successful submission does not reset by default. reset('formRef') invokes native reset, restores bound model paths to their values captured when the form mounted, and clears field errors. It does not reset unrelated state or refetch resources. File selection follows native reset behavior. Accessible pending and completion announcements are app markup or the optional UI helpers, not unexplained global popups.

## 10 Navigation and pages

Ordinary anchors and full document navigation always work without the router. Optional client routing uses template ui-route="pattern" declarations and one element with ui-outlet per root. Route templates may be inline or import a component; nested route outlets are outside 1.0. ui-link marks anchors eligible for interception. Without it, normal browser navigation remains unchanged.

Patterns begin with slash and contain literal segments, :name parameters and an optional final *rest catchall. Matching ignores a final slash except for the root and decodes each segment once; malformed encodings reject the navigation. Literal segments outrank parameters, which outrank catchalls. Ties and duplicate parameter names are compile errors. Routes match pathname only. route.params is a string map; route.query maps a key to a string or string array for repeated keys; route.hash is a string without #; route.path is the path within router.basePath. A ui-route="*" template is the required application fallback.

The router intercepts unmodified primary button clicks on same origin ui-link anchors within basePath, excluding download, external targets and same document hash links. History mode requires a host fallback to the application document for deep links; hash mode avoids that requirement. Navigation creates a new route scope, disposes the old one, updates the URL and mounts the selected template. A reused route pattern with different parameters creates a fresh scope. The application store survives.

Registered beforeNavigate guards may return false or a promise of false to cancel before commit. A later navigation cancels an earlier pending guard. Rejected guards cancel with a diagnostic. Canceled navigation leaves URL and current DOM unchanged; canceled back or forward transitions must restore the prior history position without adding entries. After commit, title comes from ui-title on the route template, which may use route expressions. Focus moves to the first h1 or the outlet made programmatically focusable. New navigation scrolls to top; back and forward restore saved scroll. Hash targets take precedence after mount. User focus inside a retained shared shell is not moved by unrelated resource refreshes.

Client route fallback markup cannot determine an HTTP status for a previously served document. Backends must provide appropriate HTTP statuses and metadata for public server rendered routes. The framework must document progressive enhancement and SEO limitations clearly.

## 11 HTML components

Components are native templates declared with ui-component="user-card" and optional ui-props containing a JSON property schema. Names must contain a hyphen and cannot use the reserved ui- prefix. Component registries are per application root. Definitions are immutable after mount; duplicate names fail validation. Inline definitions are available before instances mount, regardless of declaration order.

```html
<template ui-component="user-card"
  ui-props='{"name":{"type":"string","required":true}}'>
  <article class="card">
    <h2 ui-text="props.name"></h2>
    <slot></slot>
  </article>
</template>
<user-card name="Alice">
  <p>Member since 2026</p>
</user-card>
```

Property schema entries accept type (string, number, boolean, array or object), required (default false) and default (a matching JSON value). Missing optional props without defaults are null. Literal attributes supply string props; numeric, boolean and structured values require ui-prop-NAME="expression". Supplying both forms is invalid. Kebab case prop names remain kebab case and are read with bracket notation when necessary. Unknown nonstandard attributes intended as props are validation errors; class, style, id, role, slot, data-* and aria-* remain host attributes. Props are read only and reactive; nested objects are exposed as read only values.

Instances preserve their host and render in light DOM. Host styling remains ordinary CSS. A slot element in the definition is a projection placeholder, not Shadow DOM. Named child slot attributes choose named slots; unmatched content and duplicate slot names are validation errors. Slot fallback content uses the component scope; projected content uses its caller scope. Instances expose events with emit. Applications listen with ui-on:EVENT. Consumers own state changes rather than components mutating props. Static IDs inside component definitions and matching for, aria-labelledby, aria-describedby and aria-controls references are prefixed per instance. Cross component ID references must be passed explicitly as props. PlainUI does not register template components with the browser customElements registry; names already defined there cannot be redeclared as PlainUI components.

External definitions use an empty template ui-import="/components/user-card.html". Imports are fetched once per root from the same origin as text/html, parsed inertly and must contain only component definition templates, further import templates, whitespace and comments. Scripts and styles are rejected and never executed or installed. CSS loads separately. Nested imports are resolved before mounting; cycles fail with COMPONENT_IMPORT_CYCLE. Import failures leave instances unmounted with diagnostics; unrelated DOM can render. No tag to URL discovery, runtime package lookup or backend specific compiler is required.

The early brainstorm spelling ui-component as a custom declaration element is superseded by native template declarations. Likewise ui-set with ui-add or ui-subtract becomes explicit set commands, event.title becomes event.data.title, and colon separated success strings become structured command calls. These are draft syntax consolidations, not migrations from a released version.

## 12 Optional server rendered HTML fragments

HTML is an explicit response mode on actions: ui-response="html" requires ui-target="refName" and optionally ui-swap="inner|outer|before|after|append|prepend". Default swap is inner. ui-response defaults to json. Target references must resolve within the initiating application root. HTML responses require text/html. Failed HTTP responses are never swapped, even if their body contains HTML; the error adapter may produce a safe text message.

```html
<button ui-get="/fragments/order-summary"
  ui-response="html" ui-target="summary" ui-swap="inner">
  Refresh summary
</button>
<section ui-ref="summary" aria-live="polite">
  <p>Order summary appears here</p>
</section>
```

Fragments are parsed in an inert container, sanitized, validated and only then committed. The module MUST remove scripts, inline event attributes, embedded frames, object and embed elements, base elements, metadata links, executable URLs, inline styles and style elements. Unknown elements and attributes are removed according to a published HTML allowlist. SVG and MathML are outside the default allowlist. Untrusted user content loses all ui-* and data-ui-* directives and is never enhanced. Sanitization is required even for same origin responses.

ui-enhance="true" is allowed only if fragments.enhance is enabled for developer owned endpoint templates. This authorizes declarative behavior and must never be used for user authored HTML. It does not authorize scripts, root creation, component definitions or imports from fragment content. Existing registered components and scoped bindings may be mounted after sanitization and structural validation. Endpoint authors must escape user values before producing this trusted template.

The default element allowlist is a, abbr, article, aside, b, blockquote, br, button, caption, code, col, colgroup, dd, details, dialog, div, dl, dt, em, fieldset, figcaption, figure, footer, form, h1 through h6, header, hr, i, img, input, label, legend, li, main, nav, ol, optgroup, option, p, pre, section, select, small, span, strong, sub, summary, sup, table, tbody, td, textarea, th, thead, time, tr and ul. Unsupported elements are removed while safe text descendants are retained, except script, style, iframe, object, embed, SVG and MathML subtrees, which are removed completely. Template is allowed only for structural directives in enhanced mode.

Permitted fragment attributes are id, class, title, lang, dir, role, aria-*, nonframework data-*, href, target, rel, src, alt, width, height, name, value, type, disabled, required, readonly, multiple, checked, selected, placeholder, min, max, step, pattern, for, action, method, enctype, colspan, rowspan, scope, datetime, open, hidden, tabindex and slot. URL attributes follow the context specific URL policy; form actions must be same origin. on*, srcdoc, style, formaction and formtarget are removed. target accepts _self or _blank only; _blank adds rel noopener noreferrer. Framework data-ui-* attributes never qualify as ordinary data attributes. Enhanced mode additionally permits the standard binding, local state, model, structural, request, event, ref, component prop and behavior directives, but rejects ui-app, ui-config, ui-store, ui-route, ui-outlet, ui-component and ui-import. Registered component tags and declared props are allowed only in enhanced mode. This policy cannot be weakened through markup.

An inner swap disposes only the target's children and retains its scope. An outer swap disposes the target and requires exactly one new element with the same ui-ref; it cannot replace an application root, outlet, component host, active loop range or an ancestor of the requesting action. Other modes insert sibling or child ranges with ownership tied to the destination. The router and fragment module cannot own the same replaceable region. ui-ignore contents are not fragment targets.

Each target has a swap generation: only the most recent initiated action for that target may commit, regardless of which element triggered it. Sanitization or validation failure leaves the old DOM untouched. A successful commit preserves focus if its node survives; otherwise focus moves to the target or its replacement made temporarily focusable. Loading and errors belong to the initiating action. Fragments are not a generalized DOM morph engine and do not preserve local state in replaced ranges. JSON and fragments coexist as separate operations; one response never both updates a resource and swaps HTML implicitly.

## 13 Optional styling and accessible behavior

plainui.css is optional and provides legible native typography, form controls, buttons, spacing utilities and layout primitives. It must not be necessary for binding correctness. Tokens include --ui-color-bg, --ui-color-text, --ui-color-primary, --ui-color-danger, --ui-space-1 through --ui-space-6, --ui-radius and --ui-font. Layout utilities include ui-stack, ui-cluster, ui-grid and ui-container with documented responsive behavior. Defaults must accommodate narrow screens, 200 percent zoom, reduced motion and right to left direction. Applications may override tokens or replace CSS entirely.

The optional UI module provides native dialog open and close commands, text toasts and a tabs behavior. Dialogs use showModal, an accessible name, Escape close and focus restoration to a connected opener. Toasts use an application supplied ui-toasts region, falling back to one module created polite live region per root; errors must still be visible in the relevant form or page. Tabs are enabled with ui-use="tabs" on a container whose children use native role="tablist", role="tab" and role="tabpanel" relationships. Arrow keys, Home and End move focus; Enter or Space activates in the default manual activation mode. Behavior configuration is passed through ui-options JSON.

Native controls are the default. The framework must preserve labels, semantics and keyboard interactions, manage aria-busy on request regions and never substitute a clickable div for a button in examples. Hidden content must not remain keyboard focusable. Automated accessibility checks are necessary but release requires keyboard and assistive technology review of the reference applications.

## 14 JavaScript extension contract

PlainUI.mount returns an App. Registration must occur before mount through PlainUI.create(options), followed by register calls and app.mount(root); PlainUI.mount is the convenience form for roots requiring no custom registration. App APIs are registerCommand(name, fn), registerFormatter(name, fn), registerBehavior(name, factory), registerAdapter(name, adapter), beforeNavigate(fn), get(path), set(path, value), batch(fn), refresh(name), resetSession() and unmount(). Methods operating on names at app level resolve only application scope. Behavior context provides equivalent methods for its lexical scope plus afterFlush(fn), which schedules cancellable postflush work. batch is synchronous and rejects promise results. get returns read only snapshots; all writes use set or batch. JSON state rejects cyclic objects, nonfinite numbers and non JSON class instances.

ui-use="chart" invokes a registered behavior on an element; ui-options contains a JSON object, not an expression. Its factory receives element, read only options, scope API and AbortSignal and returns an optional cleanup function. Widgets that own descendants require ui-ignore on an inner container. Cleanup runs once before owned nodes are removed. Behaviors cannot mutate another owner's nodes without an explicit integration agreement. Registration must use public APIs; internal compiler and scheduler structures are not supported extension points.

Commands receive a context and evaluated arguments and may return a promise. Context includes scope API, event snapshot, host, refs, signal and emit. Trusted extension JavaScript can use browser APIs; the declarative expression sandbox does not sandbox that code. Adapter hooks are prepare(request, context), success(parsedBody, responseMeta) and error(normalizedError, parsedBody, responseMeta). Hooks may be async; success must return JSON compatible data. Adapter errors become kind adapter. Response bodies are read once by transport. Adapters do not get to execute response HTML or bypass origin and CSRF validation; prepare runs before final validation.

Streaming and custom transports may be built as behaviors; replacing the core transport is not a public 1.0 API. Plugins must declare compatible PlainUI major versions, register before mount and clean up all listeners and subscriptions. A diagnostic inspector API exposes redacted resource status and ownership counts in development, never credentials or raw response bodies by default.

## 15 Security and operational behavior

The expression interpreter must work without eval, Function or executable inline event handlers. Dynamic values go to text or constrained DOM sinks. Attribute binding forbids on* attributes, srcdoc and unsafe URL schemes. JSON parsing, object paths and component props reject prototype pollution keys. Template attributes are trusted application code: expression safety does not make arbitrary third party directives safe. After 100 reactive passes without quiescence in one microtask, a root stops reactive work with UPDATE_LOOP; other roots continue.

Requests use browser Fetch and respect CORS and credentials behavior. PlainUI is not a CORS proxy and does not bypass server permissions. Redirects are rejected to prevent requests escaping origin policy. Authentication may use cookies or a request adapter; automatic token storage, login UI and refresh token replay are outside core. Mutations are never retried automatically. Network failure or cancellation may leave server outcome unknown; the UI must support reconciliation through a GET before retrying a nonidempotent operation.

The runtime must document a strict CSP deployment with external assets, no unsafe-eval and no executable inline script requirement. Trusted Types support must be provided by the fragment module where enforced, with its sole HTML sink behind the sanitizer policy. Debug diagnostics redact headers, tokens, bodies and query values by default. Production logs expose a code, root, directive location and request correlation identifier when available. No telemetry is sent by default.

## 16 Complete attribute registry

Only attributes listed here are standard 1.0 directives. Unknown ui-* attributes emit UNKNOWN_DIRECTIVE and do not execute. Names after a colon or hyphen in dynamic families are validated against the stated policy. Presence flags accept an empty value only. Ordinary HTML attributes keep browser semantics.

### 16.1 Roots and state

| Attribute | Value kind | Placement and default |
| --- | --- | --- |
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

### 16.2 Bindings and structure

| Attribute | Value kind | Placement and rule |
| --- | --- | --- |
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

The ui-bind allowlist is id, title, value, checked, disabled, required, readonly, multiple, selected, hidden, open, name, placeholder, min, max, step, pattern, type, href, src, alt, width, height, colspan, rowspan, role, tabindex, aria-* and data-* excluding data-ui-*. URL sinks use the URL policy. An attribute owned by another directive cannot also be bound: ui-show with ui-bind-hidden and ui-model with ui-bind-value or checked are errors. ui-text cannot share an element with component rendering, ui-outlet, ui-field-error or owned child bindings.

### 16.3 HTTP and events

| Attribute | Value kind | Placement and default |
| --- | --- | --- |
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

### 16.4 Routing components fragments and behaviors

| Attribute | Value kind | Placement and default |
| --- | --- | --- |
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

## 17 Representative application contracts

The code snippets in this RFC are feature excerpts. Route based snippets require the router, a matched route and its outlet; toast and dialog commands require the UI module. Complete runnable examples must supply those prerequisites and the relevant API fixtures.

The public blog demonstrates server content with enhanced search, article routes, metadata, sanitized article fragments and loading/error/empty views. It must retain readable HTML without JavaScript where the backend provides it. A JSON only blog is valid but must document that its client fetched article text is unavailable until JavaScript runs.

The storefront demonstrates product resources, query filters, a shared cart, derived totals, persistence, component cards, checkout forms and server authoritative prices. A cart persisted locally is a convenience, never the authority for payment totals or stock. A custom command handles line item edits through the public store API.

The SaaS example demonstrates an authenticated shell, parameter routes, forms with field errors, pagination, dialogs, independent resource invalidation and a third party chart behavior. Backend errors and uncertain mutation outcomes must be visible. All three examples must use the same core syntax and run against independent HTTP implementations without changing their components.

## 18 Conformance and release acceptance

| Gate | Evidence required before the 1.0 tag |
| --- | --- |
| Contract | Every registry entry has valid, invalid and lifecycle fixtures; all examples validate |
| Runtime | Disposal, repeated mount, nested scope, keyed reorder and derived cycle tests pass |
| Data | Out of order responses, shared cancellation, principal reset and cache invalidation pass |
| Forms | Native validation, composition input, submitter values, files and mapped errors pass |
| Router | Deep links, canceled history changes, focus and scroll restoration pass |
| Fragments | Allowlist security suite, latest target wins and failed swap preservation pass |
| Extensions | Chart/editor integration mounts and unmounts without retained listeners |
| Accessibility | Reference apps pass automated checks plus manual keyboard and screen reader review |
| Packaging | Script and module parity, strict CSP examples, zero build quick start and published API reference |
| Browser support | Release time current and previous stable Chromium, Firefox and Safari desktop; current iOS Safari and Android Chrome, with recorded exact versions |
| Performance | Measured budgets and repeatable traces described by the design document pass |
| Documentation | Blog, storefront and SaaS walkthroughs; backend recipes; migration and security guidance |

Performance goals are release targets, not achieved measurements: core at most 35 KiB gzip, core plus all optional JavaScript at most 70 KiB gzip, and a keyed update of ten items in a 1000 item list below 16 ms at the 95th percentile on the recorded reference machine. Baselines and test fixtures must be published before beta. If a budget is missed, the RFC must be revised transparently; features cannot silently be removed to declare 1.0 complete.

The project may implement milestones, but 1.0 requires the entire scope above. Versioning follows semantic versioning after 1.0. Adding nonconflicting directives is a minor change; changing parsing, defaults, lifecycle ordering or existing observable behavior is major unless it corrects a documented security defect. Patch security changes must be called out with migration guidance.

## 19 Alternatives and review decisions

HTML was chosen over a new declarative language to retain browser tools and backend familiarity. JSON is the default because it separates data from presentation without requiring backend templates. HTML fragments remain explicit to support existing server renderers. A small interpreted expression language avoids general JavaScript in attributes while allowing predictable bindings. Components use light DOM for ordinary CSS; Shadow DOM is not required for 1.0.

Before accepting this RFC, reviewers should approve the canonical syntax, module boundary, expression subset, resource record shape, strict fragment trust model, mutation concurrency defaults and browser/performance gates. These are concrete proposed defaults, not unspecified placeholders. Subsequent changes must update this RFC, the design and conformance fixtures together.

## 20 Platform references

These references govern browser integration, not the proposed PlainUI API. Consulted 10 October 2026.

WHATWG HTML Living Standard. Native forms, templates, elements and history integration. https://html.spec.whatwg.org/multipage/

WHATWG Fetch Standard. Request, response, credentials and CORS behavior. https://fetch.spec.whatwg.org/

W3C Content Security Policy Level 3. Deployment policy and script execution constraints. https://www.w3.org/TR/CSP3/

W3C WAI ARIA Authoring Practices Guide. Modal dialog keyboard and focus behavior. https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
