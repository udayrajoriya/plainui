import {FORBIDDEN_KEYS,IDENTIFIER} from '../../../schema/src/allowlists.js';
import {PlainUIError} from '../diagnostics/codes.js';
import {normalizeJson,type JsonValue} from '../json/normalize.js';
import type {BindingSource,Scope,ScopeCell} from './scope.js';
export const RESERVED_NAMES=new Set(['store','route','props','$event','$action','$result','$error']);
export function declareBinding(scope:Scope,name:string,source:BindingSource,value:JsonValue):ScopeCell {
  if(!scope.owner.active)throw new PlainUIError('OWNER_DISPOSED');
  if(!IDENTIFIER.test(name)||FORBIDDEN_KEYS.has(name)||RESERVED_NAMES.has(name))throw new PlainUIError('RESERVED_NAME');
  if(scope.bindings.has(name))throw new PlainUIError('DECLARATION_DUPLICATE');
  const cell:ScopeCell={value:normalizeJson(value),version:0,writable:source==='state'||source==='store',source};scope.bindings.set(name,cell);return cell;
}
export function installContext(scope:Scope,name:'store'|'route'|'props'|'$event'|'$action'|'$result'|'$error',value:JsonValue):ScopeCell {
  if(scope.bindings.has(name))throw new PlainUIError('DECLARATION_DUPLICATE');
  const cell:ScopeCell={value,version:0,writable:false,source:name.startsWith('$')?'event':name==='store'?'store':name==='route'?'route':'props'};
  scope.bindings.set(name,cell);return cell;
}
