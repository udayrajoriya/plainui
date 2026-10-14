export const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
export const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
export const BIND_ATTRIBUTES = new Set('id title value checked disabled required readonly multiple selected hidden open name placeholder min max step pattern type href src alt width height colspan rowspan role tabindex'.split(' '));
export const BOOLEAN_ATTRIBUTES = new Set('checked disabled required readonly multiple selected hidden open'.split(' '));
export const FRAGMENT_TAGS = new Set('a abbr article aside b blockquote br button caption code col colgroup dd details dialog div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr i img input label legend li main nav ol optgroup option p pre section select small span strong sub summary sup table tbody td textarea th thead time tr ul'.split(' '));
export const FRAGMENT_ATTRIBUTES = new Set('id class title lang dir role href target rel src alt width height name value type disabled required readonly multiple checked selected placeholder min max step pattern for action method enctype colspan rowspan scope datetime open hidden tabindex slot'.split(' '));
export const FRAGMENT_DROP_SUBTREES = new Set('script style iframe object embed svg math'.split(' '));
export const ENHANCED_DIRECTIVES = new Set('ui-state ui-derived ui-value ui-text ui-src ui-href ui-class ui-show ui-model ui-field-error ui-if ui-else-if ui-else ui-for ui-key ui-data ui-get ui-post ui-put ui-patch ui-delete ui-load ui-query ui-headers ui-body ui-adapter ui-credentials ui-timeout ui-cache ui-retry ui-action ui-trigger ui-concurrency ui-debounce ui-invalidate ui-encoding ui-response ui-target ui-swap ui-enhance ui-ref ui-ignore ui-cloak ui-use ui-options'.split(' '));
export const ENHANCED_FAMILIES = new Set(['ui-bind-*', 'ui-on:*', 'ui-prop-*']);
export const DOM_EVENTS = new Set('click input change submit keydown keyup focus blur'.split(' '));
export const LIFECYCLE_EVENTS = new Set('success error finally'.split(' '));
export const EVENT_MODIFIERS = new Set('prevent stop once self'.split(' '));
export function safeAttributeSuffix(suffix: string): boolean { return /^[a-z0-9_.:-]+$/.test(suffix) && !suffix.startsWith('ui-'); }
export function bindSinkAllowed(sink: string): boolean { return BIND_ATTRIBUTES.has(sink) || ((sink.startsWith('aria-') || sink.startsWith('data-')) && safeAttributeSuffix(sink.slice(sink.indexOf('-') + 1))); }
