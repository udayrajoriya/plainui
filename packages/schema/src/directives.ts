import { bindSinkAllowed, DOM_EVENTS, EVENT_MODIFIERS, IDENTIFIER, LIFECYCLE_EVENTS } from './allowlists.js';
import type { DiagnosticCode } from './diagnostics.js';

export type ValueKind = 'literal' | 'identifier' | 'json-object' | 'json-schema' | 'expression' | 'path' | 'url-template' | 'command-list' | 'presence' | 'integer' | 'enum' | 'names' | 'loop';
export type Placement = 'root' | 'element' | 'template' | 'derived' | 'resource' | 'request' | 'action' | 'form' | 'route' | 'component-definition' | 'component-instance' | 'import' | 'behavior' | 'toasts';
export type Module = 'core' | 'data' | 'forms' | 'components' | 'router' | 'fragments' | 'ui';
export type Directive = { name: string; kind: ValueKind; placement: Placement; module: Module; default?: unknown; values?: readonly string[]; min?: number; max?: number; requires?: readonly string[]; conflicts?: readonly string[] };
const d = (name: string, kind: ValueKind, placement: Placement, module: Module, rest: Omit<Directive, 'name' | 'kind' | 'placement' | 'module'> = {}): Directive => ({ name, kind, placement, module, ...rest });
export const DIRECTIVES: readonly Directive[] = [
  d('ui-app','literal','root','core'), d('ui-config','literal','root','core'),
  d('ui-state','json-object','element','core'), d('ui-store','json-object','root','core',{default:{}}),
  d('ui-derived','identifier','derived','core',{requires:['ui-value']}), d('ui-value','expression','derived','core',{requires:['ui-derived']}),
  d('ui-persist','enum','element','core',{values:['session','local'],requires:['ui-persist-key']}), d('ui-persist-key','literal','element','core',{requires:['ui-persist']}),
  d('ui-cloak','presence','element','core'), d('ui-ref','identifier','element','core'), d('ui-ignore','presence','element','core'),
  d('ui-text','expression','element','core',{conflicts:['ui-outlet','ui-component','ui-field-error']}),
  d('ui-bind-*','expression','element','core'), d('ui-src','expression','element','core',{conflicts:['ui-bind-src']}), d('ui-href','expression','element','core',{conflicts:['ui-bind-href']}),
  d('ui-class','expression','element','core'), d('ui-show','expression','element','core',{conflicts:['ui-bind-hidden']}), d('ui-model','path','element','forms',{conflicts:['ui-bind-value','ui-bind-checked']}),
  d('ui-if','expression','template','core',{conflicts:['ui-for']}), d('ui-else-if','expression','template','core'), d('ui-else','presence','template','core'),
  d('ui-for','loop','template','core',{requires:['ui-key'],conflicts:['ui-if']}), d('ui-key','expression','template','core',{requires:['ui-for']}),
  d('ui-data','identifier','resource','data',{requires:['ui-get']}),
  d('ui-get','url-template','request','data'), d('ui-post','url-template','request','data'), d('ui-put','url-template','request','data'), d('ui-patch','url-template','request','data'), d('ui-delete','url-template','request','data'),
  d('ui-load','enum','resource','data',{values:['auto','manual','visible'],default:'auto'}), d('ui-query','expression','request','data'), d('ui-headers','expression','request','data'), d('ui-body','expression','request','data'),
  d('ui-adapter','identifier','request','data',{default:'identity'}), d('ui-credentials','enum','request','data',{values:['omit','same-origin','include'],default:'same-origin'}),
  d('ui-timeout','integer','request','data',{min:1,default:30000}), d('ui-cache','integer','resource','data',{min:0,default:0}), d('ui-retry','integer','request','data',{min:0,max:3,default:0}),
  d('ui-action','identifier','action','data'), d('ui-trigger','literal','action','data'), d('ui-concurrency','enum','action','data',{values:['drop','replace'],default:'drop'}),
  d('ui-debounce','integer','action','data',{min:0,default:0}), d('ui-invalidate','names','action','data'), d('ui-on:*','command-list','element','core'),
  d('ui-encoding','enum','form','forms',{values:['json','form','multipart'],default:'json'}), d('ui-field-error','literal','form','forms'),
  d('ui-route','literal','route','router'), d('ui-outlet','presence','element','router'), d('ui-link','presence','element','router'), d('ui-title','expression','route','router'),
  d('ui-component','literal','component-definition','components'), d('ui-props','json-schema','component-definition','components',{default:{}}), d('ui-prop-*','expression','component-instance','components'), d('ui-import','literal','import','components'),
  d('ui-response','enum','action','fragments',{values:['json','html'],default:'json'}), d('ui-target','literal','action','fragments'), d('ui-swap','enum','action','fragments',{values:['inner','outer','before','after','append','prepend'],default:'inner'}), d('ui-enhance','enum','action','fragments',{values:['true','false'],default:'false'}),
  d('ui-use','names','behavior','ui'), d('ui-options','json-object','behavior','ui'), d('ui-toasts','presence','toasts','ui'),
];
export const HTTP_METHODS = ['ui-get','ui-post','ui-put','ui-patch','ui-delete'] as const;
export type DirectiveIssue = { code: DiagnosticCode; name: string };
export type AttributeInput = ReadonlyMap<string,string> | Record<string,string>;
const entries = (input: AttributeInput): [string,string][] => input instanceof Map ? [...input] : Object.entries(input);
export function canonicalDirective(name: string): string { return name.startsWith('data-ui-') ? name.slice(5) : name; }
export function resolveDirective(name: string): Directive | undefined {
  const key = canonicalDirective(name);
  const exact = DIRECTIVES.find(row => row.name === key);
  if (exact) return exact;
  if (key.startsWith('ui-bind-') && bindSinkAllowed(key.slice(8)) && !['class','style'].includes(key.slice(8))) return DIRECTIVES.find(row => row.name === 'ui-bind-*');
  if (key.startsWith('ui-prop-') && IDENTIFIER.test(key.slice(8))) return DIRECTIVES.find(row => row.name === 'ui-prop-*');
  if (key.startsWith('ui-on:')) {
    const [event, ...modifiers] = key.slice(6).split('.');
    if (!event || (!DOM_EVENTS.has(event) && !LIFECYCLE_EVENTS.has(event)) || modifiers.some(m => !EVENT_MODIFIERS.has(m)) || new Set(modifiers).size !== modifiers.length || (LIFECYCLE_EVENTS.has(event) && modifiers.length)) return undefined;
    return DIRECTIVES.find(row => row.name === 'ui-on:*');
  }
  return undefined;
}
export function validateDirectiveValue(row: Directive, value: string): boolean {
  if (row.kind === 'presence') return value === '';
  if (row.kind === 'integer') return /^(0|[1-9][0-9]*)$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) >= (row.min ?? 0) && Number(value) <= (row.max ?? Number.MAX_SAFE_INTEGER);
  if (row.kind === 'enum') return row.values?.includes(value) ?? false;
  if (row.kind === 'identifier') return IDENTIFIER.test(value);
  if (row.kind === 'names') return value.trim() !== '' && value.trim().split(/\s+/).every(name => IDENTIFIER.test(name));
  if (row.kind === 'literal') return value.trim() !== '';
  if (row.kind === 'json-object' || row.kind === 'json-schema') { try { const parsed: unknown = JSON.parse(value); return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed); } catch { return false; } }
  return value.trim() !== '';
}
export function validateAttributeSet(input: AttributeInput, context: { tagName?: string; hasOwnedChildren?: boolean } = {}): DirectiveIssue[] {
  const issues: DirectiveIssue[] = [];
  const values = new Map<string,string>();
  for (const [spelling,value] of entries(input)) {
    if (!spelling.startsWith('ui-') && !spelling.startsWith('data-ui-')) continue;
    const name = canonicalDirective(spelling);
    const row = resolveDirective(spelling);
    if (!row) { issues.push({code:'UNKNOWN_DIRECTIVE',name:spelling}); continue; }
    if (values.has(name)) { issues.push({code:'DIRECTIVE_CONFLICT',name}); continue; }
    values.set(name,value);
    if (!validateDirectiveValue(row,value)) issues.push({code:'DIRECTIVE_VALUE',name});
    if (row.placement === 'root' && context.tagName === 'template') issues.push({code:'DIRECTIVE_VALUE',name});
    if (row.placement === 'template' && context.tagName && context.tagName !== 'template') issues.push({code:'DIRECTIVE_VALUE',name});
  }
  for (const row of DIRECTIVES) if (values.has(row.name)) {
    for (const required of row.requires ?? []) if (!values.has(required)) issues.push({code:'DIRECTIVE_CONFLICT',name:row.name});
    for (const conflict of row.conflicts ?? []) if (values.has(conflict)) issues.push({code:'DIRECTIVE_CONFLICT',name:row.name});
  }
  const methods = HTTP_METHODS.filter(name => values.has(name));
  if (methods.length > 1) issues.push({code:'DIRECTIVE_CONFLICT',name:methods.join(',')});
  if (values.has('ui-data') && (context.tagName !== 'template' || context.hasOwnedChildren)) issues.push({code:'DIRECTIVE_VALUE',name:'ui-data'});
  if (values.has('ui-get') && values.has('ui-body')) issues.push({code:'DIRECTIVE_CONFLICT',name:'ui-body'});
  if (values.has('ui-retry') && methods.some(m => m !== 'ui-get')) issues.push({code:'DIRECTIVE_CONFLICT',name:'ui-retry'});
  if (values.has('ui-text') && context.hasOwnedChildren) issues.push({code:'DIRECTIVE_CONFLICT',name:'ui-text'});
  return issues;
}
