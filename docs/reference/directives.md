# Directive reference

Generated from schema version 1 for PlainUI 1.0.0. Each entry has one canonical spelling and one `data-` alias.


## ui-app

- Alias: `data-ui-app`
- Kind: `literal`
- Placement: `root`
- Module: `core`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="value"></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app></main>
```

## ui-config

- Alias: `data-ui-config`
- Kind: `literal`
- Placement: `root`
- Module: `core`
- Default: none
- Companions: none

Valid:

```html
<main ui-config="value"></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-config></main>
```

## ui-state

- Alias: `data-ui-state`
- Kind: `json-object`
- Placement: `element`
- Module: `core`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-state="{}"></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-state="{"></section></main>
```

## ui-store

- Alias: `data-ui-store`
- Kind: `json-object`
- Placement: `root`
- Module: `core`
- Default: `{}`
- Companions: none

Valid:

```html
<main ui-store="{}"></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-store="{"></main>
```

## ui-derived

- Alias: `data-ui-derived`
- Kind: `identifier`
- Placement: `derived`
- Module: `core`
- Default: none
- Companions: requires `ui-value`

Valid:

```html
<main ui-app="app"><template ui-derived="item" ui-value="item"></template></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><template ui-derived="bad-name" ui-value="item"></template></main>
```

## ui-value

- Alias: `data-ui-value`
- Kind: `expression`
- Placement: `derived`
- Module: `core`
- Default: none
- Companions: requires `ui-derived`

Valid:

```html
<main ui-app="app"><template ui-value="item" ui-derived="item"></template></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><template ui-value="(" ui-derived="item"></template></main>
```

## ui-persist

- Alias: `data-ui-persist`
- Kind: `enum`
- Placement: `element`
- Module: `core`
- Default: none
- Companions: requires `ui-persist-key`

Valid:

```html
<main ui-app="app"><section ui-persist="session" ui-persist-key="value"></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-persist="invalid" ui-persist-key="value"></section></main>
```

## ui-persist-key

- Alias: `data-ui-persist-key`
- Kind: `literal`
- Placement: `element`
- Module: `core`
- Default: none
- Companions: requires `ui-persist`

Valid:

```html
<main ui-app="app"><section ui-persist-key="value" ui-persist="session"></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-persist-key ui-persist="session"></section></main>
```

## ui-cloak

- Alias: `data-ui-cloak`
- Kind: `presence`
- Placement: `element`
- Module: `core`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-cloak></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-cloak="invalid"></section></main>
```

## ui-ref

- Alias: `data-ui-ref`
- Kind: `identifier`
- Placement: `element`
- Module: `core`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-ref="item"></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-ref="bad-name"></section></main>
```

## ui-ignore

- Alias: `data-ui-ignore`
- Kind: `presence`
- Placement: `element`
- Module: `core`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-ignore></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-ignore="invalid"></section></main>
```

## ui-text

- Alias: `data-ui-text`
- Kind: `expression`
- Placement: `element`
- Module: `core`
- Default: none
- Companions: conflicts with `ui-outlet`; conflicts with `ui-component`; conflicts with `ui-field-error`

Valid:

```html
<main ui-app="app"><section ui-text="item"></section></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><section ui-text="("></section></main>
```

## ui-bind-*

- Alias: `data-ui-bind-*`
- Kind: `expression`
- Placement: `element`
- Module: `core`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-bind-title="item"></section></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><section ui-bind-title="("></section></main>
```

## ui-src

- Alias: `data-ui-src`
- Kind: `expression`
- Placement: `element`
- Module: `core`
- Default: none
- Companions: conflicts with `ui-bind-src`

Valid:

```html
<main ui-app="app"><section ui-src="item"></section></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><section ui-src="("></section></main>
```

## ui-href

- Alias: `data-ui-href`
- Kind: `expression`
- Placement: `element`
- Module: `core`
- Default: none
- Companions: conflicts with `ui-bind-href`

Valid:

```html
<main ui-app="app"><section ui-href="item"></section></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><section ui-href="("></section></main>
```

## ui-class

- Alias: `data-ui-class`
- Kind: `expression`
- Placement: `element`
- Module: `core`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-class="item"></section></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><section ui-class="("></section></main>
```

## ui-show

- Alias: `data-ui-show`
- Kind: `expression`
- Placement: `element`
- Module: `core`
- Default: none
- Companions: conflicts with `ui-bind-hidden`

Valid:

```html
<main ui-app="app"><section ui-show="item"></section></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><section ui-show="("></section></main>
```

## ui-model

- Alias: `data-ui-model`
- Kind: `path`
- Placement: `element`
- Module: `forms`
- Default: none
- Companions: conflicts with `ui-bind-value`; conflicts with `ui-bind-checked`

Valid:

```html
<main ui-app="app"><section ui-model="item"></section></main>
```

Invalid (expected `PATH_INVALID`):

```html
<main ui-app="app"><section ui-model="item()"></section></main>
```

## ui-if

- Alias: `data-ui-if`
- Kind: `expression`
- Placement: `template`
- Module: `core`
- Default: none
- Companions: conflicts with `ui-for`

Valid:

```html
<main ui-app="app"><template ui-if="item"></template></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><template ui-if="("></template></main>
```

## ui-else-if

- Alias: `data-ui-else-if`
- Kind: `expression`
- Placement: `template`
- Module: `core`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><template ui-else-if="item"></template></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><template ui-else-if="("></template></main>
```

## ui-else

- Alias: `data-ui-else`
- Kind: `presence`
- Placement: `template`
- Module: `core`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><template ui-else></template></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><template ui-else="invalid"></template></main>
```

## ui-for

- Alias: `data-ui-for`
- Kind: `loop`
- Placement: `template`
- Module: `core`
- Default: none
- Companions: requires `ui-key`; conflicts with `ui-if`

Valid:

```html
<main ui-app="app"><template ui-for="item in items" ui-key="item"></template></main>
```

Invalid (expected `LOOP_INVALID`):

```html
<main ui-app="app"><template ui-for="invalid" ui-key="item"></template></main>
```

## ui-key

- Alias: `data-ui-key`
- Kind: `expression`
- Placement: `template`
- Module: `core`
- Default: none
- Companions: requires `ui-for`

Valid:

```html
<main ui-app="app"><template ui-key="item" ui-for="item in items"></template></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><template ui-key="(" ui-for="item in items"></template></main>
```

## ui-data

- Alias: `data-ui-data`
- Kind: `identifier`
- Placement: `resource`
- Module: `data`
- Default: none
- Companions: requires `ui-get`

Valid:

```html
<main ui-app="app"><template ui-data="item" ui-get="/api/items"></template></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><template ui-data="bad-name" ui-get="/api/items"></template></main>
```

## ui-get

- Alias: `data-ui-get`
- Kind: `url-template`
- Placement: `request`
- Module: `data`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-get="/api/items"></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-get></section></main>
```

## ui-post

- Alias: `data-ui-post`
- Kind: `url-template`
- Placement: `request`
- Module: `data`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-post="/api/items"></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-post></section></main>
```

## ui-put

- Alias: `data-ui-put`
- Kind: `url-template`
- Placement: `request`
- Module: `data`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-put="/api/items"></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-put></section></main>
```

## ui-patch

- Alias: `data-ui-patch`
- Kind: `url-template`
- Placement: `request`
- Module: `data`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-patch="/api/items"></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-patch></section></main>
```

## ui-delete

- Alias: `data-ui-delete`
- Kind: `url-template`
- Placement: `request`
- Module: `data`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-delete="/api/items"></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-delete></section></main>
```

## ui-load

- Alias: `data-ui-load`
- Kind: `enum`
- Placement: `resource`
- Module: `data`
- Default: `"auto"`
- Companions: none

Valid:

```html
<main ui-app="app"><template ui-load="auto"></template></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><template ui-load="invalid"></template></main>
```

## ui-query

- Alias: `data-ui-query`
- Kind: `expression`
- Placement: `request`
- Module: `data`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-query="item"></section></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><section ui-query="("></section></main>
```

## ui-headers

- Alias: `data-ui-headers`
- Kind: `expression`
- Placement: `request`
- Module: `data`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-headers="item"></section></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><section ui-headers="("></section></main>
```

## ui-body

- Alias: `data-ui-body`
- Kind: `expression`
- Placement: `request`
- Module: `data`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-body="item"></section></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><section ui-body="("></section></main>
```

## ui-adapter

- Alias: `data-ui-adapter`
- Kind: `identifier`
- Placement: `request`
- Module: `data`
- Default: `"identity"`
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-adapter="item"></section></main>
```

Invalid (expected `ADAPTER_ERROR`):

```html
<main ui-app="app"><section ui-adapter="bad-name"></section></main>
```

## ui-credentials

- Alias: `data-ui-credentials`
- Kind: `enum`
- Placement: `request`
- Module: `data`
- Default: `"same-origin"`
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-credentials="omit"></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-credentials="invalid"></section></main>
```

## ui-timeout

- Alias: `data-ui-timeout`
- Kind: `integer`
- Placement: `request`
- Module: `data`
- Default: `30000`
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-timeout="1"></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-timeout="-1"></section></main>
```

## ui-cache

- Alias: `data-ui-cache`
- Kind: `integer`
- Placement: `resource`
- Module: `data`
- Default: `0`
- Companions: none

Valid:

```html
<main ui-app="app"><template ui-cache="0"></template></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><template ui-cache="-1"></template></main>
```

## ui-retry

- Alias: `data-ui-retry`
- Kind: `integer`
- Placement: `request`
- Module: `data`
- Default: `0`
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-retry="0"></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-retry="-1"></section></main>
```

## ui-action

- Alias: `data-ui-action`
- Kind: `identifier`
- Placement: `action`
- Module: `data`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><button ui-post="/api" ui-action="item">Run</button></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><button ui-post="/api" ui-action="bad-name">Run</button></main>
```

## ui-trigger

- Alias: `data-ui-trigger`
- Kind: `literal`
- Placement: `action`
- Module: `data`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><button ui-post="/api" ui-trigger="value">Run</button></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><button ui-post="/api" ui-trigger>Run</button></main>
```

## ui-concurrency

- Alias: `data-ui-concurrency`
- Kind: `enum`
- Placement: `action`
- Module: `data`
- Default: `"drop"`
- Companions: none

Valid:

```html
<main ui-app="app"><button ui-post="/api" ui-concurrency="drop">Run</button></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><button ui-post="/api" ui-concurrency="invalid">Run</button></main>
```

## ui-debounce

- Alias: `data-ui-debounce`
- Kind: `integer`
- Placement: `action`
- Module: `data`
- Default: `0`
- Companions: none

Valid:

```html
<main ui-app="app"><button ui-post="/api" ui-debounce="0">Run</button></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><button ui-post="/api" ui-debounce="-1">Run</button></main>
```

## ui-invalidate

- Alias: `data-ui-invalidate`
- Kind: `names`
- Placement: `action`
- Module: `data`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><button ui-post="/api" ui-invalidate="item">Run</button></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><button ui-post="/api" ui-invalidate="bad-name">Run</button></main>
```

## ui-on:*

- Alias: `data-ui-on:*`
- Kind: `command-list`
- Placement: `element`
- Module: `core`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-on:click="set(count, 1)"></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-on:click="set("></section></main>
```

## ui-encoding

- Alias: `data-ui-encoding`
- Kind: `enum`
- Placement: `form`
- Module: `forms`
- Default: `"json"`
- Companions: none

Valid:

```html
<main ui-app="app"><form action="/api" method="post" ui-post="/api" ui-encoding="json"></form></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><form action="/api" method="post" ui-post="/api" ui-encoding="invalid"></form></main>
```

## ui-field-error

- Alias: `data-ui-field-error`
- Kind: `literal`
- Placement: `form`
- Module: `forms`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><form action="/api" method="post" ui-post="/api"><span ui-field-error="value"></span></form></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><form action="/api" method="post" ui-post="/api"><span ui-field-error></span></form></main>
```

## ui-route

- Alias: `data-ui-route`
- Kind: `literal`
- Placement: `route`
- Module: `router`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><template ui-route="/items"></template></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><template ui-route></template></main>
```

## ui-outlet

- Alias: `data-ui-outlet`
- Kind: `presence`
- Placement: `element`
- Module: `router`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-outlet></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-outlet="invalid"></section></main>
```

## ui-link

- Alias: `data-ui-link`
- Kind: `presence`
- Placement: `element`
- Module: `router`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-link></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-link="invalid"></section></main>
```

## ui-title

- Alias: `data-ui-title`
- Kind: `expression`
- Placement: `route`
- Module: `router`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><template ui-title="item"></template></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><template ui-title="("></template></main>
```

## ui-component

- Alias: `data-ui-component`
- Kind: `literal`
- Placement: `component-definition`
- Module: `components`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><template ui-component="value"></template></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><template ui-component></template></main>
```

## ui-props

- Alias: `data-ui-props`
- Kind: `json-schema`
- Placement: `component-definition`
- Module: `components`
- Default: `{}`
- Companions: none

Valid:

```html
<main ui-app="app"><template ui-props="{}"></template></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><template ui-props="{"></template></main>
```

## ui-prop-*

- Alias: `data-ui-prop-*`
- Kind: `expression`
- Placement: `component-instance`
- Module: `components`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><x-card ui-prop-name="item"></x-card></main>
```

Invalid (expected `EXPRESSION_PARSE`):

```html
<main ui-app="app"><x-card ui-prop-name="("></x-card></main>
```

## ui-import

- Alias: `data-ui-import`
- Kind: `literal`
- Placement: `import`
- Module: `components`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><template ui-import="value"></template></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><template ui-import></template></main>
```

## ui-response

- Alias: `data-ui-response`
- Kind: `enum`
- Placement: `action`
- Module: `fragments`
- Default: `"json"`
- Companions: none

Valid:

```html
<main ui-app="app"><button ui-post="/api" ui-response="json">Run</button></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><button ui-post="/api" ui-response="invalid">Run</button></main>
```

## ui-target

- Alias: `data-ui-target`
- Kind: `literal`
- Placement: `action`
- Module: `fragments`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><button ui-post="/api" ui-target="value">Run</button></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><button ui-post="/api" ui-target>Run</button></main>
```

## ui-swap

- Alias: `data-ui-swap`
- Kind: `enum`
- Placement: `action`
- Module: `fragments`
- Default: `"inner"`
- Companions: none

Valid:

```html
<main ui-app="app"><button ui-post="/api" ui-swap="inner">Run</button></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><button ui-post="/api" ui-swap="invalid">Run</button></main>
```

## ui-enhance

- Alias: `data-ui-enhance`
- Kind: `enum`
- Placement: `action`
- Module: `fragments`
- Default: `"false"`
- Companions: none

Valid:

```html
<main ui-app="app"><button ui-post="/api" ui-enhance="true">Run</button></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><button ui-post="/api" ui-enhance="invalid">Run</button></main>
```

## ui-use

- Alias: `data-ui-use`
- Kind: `names`
- Placement: `behavior`
- Module: `ui`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-use="item"></section></main>
```

Invalid (expected `BEHAVIOR_INVALID`):

```html
<main ui-app="app"><section ui-use="bad-name"></section></main>
```

## ui-options

- Alias: `data-ui-options`
- Kind: `json-object`
- Placement: `behavior`
- Module: `ui`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-options="{}"></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-options="{"></section></main>
```

## ui-toasts

- Alias: `data-ui-toasts`
- Kind: `presence`
- Placement: `toasts`
- Module: `ui`
- Default: none
- Companions: none

Valid:

```html
<main ui-app="app"><section ui-toasts></section></main>
```

Invalid (expected `DIRECTIVE_VALUE`):

```html
<main ui-app="app"><section ui-toasts="invalid"></section></main>
```
