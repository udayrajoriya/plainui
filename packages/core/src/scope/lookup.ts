import {PlainUIError} from '../diagnostics/codes.js';
import type {JsonValue} from '../json/normalize.js';
import type {ResourceHandle,Scope,ScopeCell} from './scope.js';
import {declareBinding} from './declarations.js';
export function appScope(scope:Scope):Scope {let current=scope;while(current.parent)current=current.parent;if(current.kind!=='app')throw new PlainUIError('REGISTRY_INVALID');return current;}
export function lookupBinding(scope:Scope,name:string):ScopeCell|undefined {for(let current:Scope|null=scope;current;current=current.parent){const binding=current.bindings.get(name);if(binding)return binding;}return undefined;}
export function lookupAppBinding(scope:Scope,name:string):ScopeCell|undefined {return appScope(scope).bindings.get(name);}
export function lexicalReader(scope:Scope):{read:(name:string)=>{found:boolean;value:JsonValue}} {return {read:name=>{const cell=lookupBinding(scope,name);return {found:!!cell,value:cell?.value??null};}};}
export function registerResource(scope:Scope,name:string,resource:ResourceHandle):void {if(scope.resources.has(name)||scope.bindings.has(name)&&scope.bindings.get(name)?.source!=='resource')throw new PlainUIError('DECLARATION_DUPLICATE');if(!scope.bindings.has(name))declareBinding(scope,name,'resource',null);scope.resources.set(name,resource);}
export function lookupResource(scope:Scope,name:string,appOnly=false):ResourceHandle|undefined {for(let current:Scope|null=appOnly?appScope(scope):scope;current;current=appOnly?null:current.parent){const resource=current.resources.get(name);if(resource)return resource;}return undefined;}
