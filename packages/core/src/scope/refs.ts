import {FORBIDDEN_KEYS,IDENTIFIER} from '../../../schema/src/allowlists.js';
import {PlainUIError} from '../diagnostics/codes.js';
import type {Scope} from './scope.js';
export function registerRef(scope:Scope,name:string,element:Element):()=>void {
  if(!scope.owner.active)throw new PlainUIError('OWNER_DISPOSED');
  if(!IDENTIFIER.test(name)||FORBIDDEN_KEYS.has(name))throw new PlainUIError('REF_INVALID');
  if(scope.refs.has(name))throw new PlainUIError('REF_INVALID');
  scope.refs.set(name,element);let active=true;
  return()=>{if(active){active=false;if(scope.refs.get(name)===element)scope.refs.delete(name);}};
}
export function lookupRef(scope:Scope,name:string):Element|undefined {for(let current:Scope|null=scope;current;current=current.parent){const ref=current.refs.get(name);if(ref)return ref;}return undefined;}
