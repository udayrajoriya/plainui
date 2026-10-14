import type {JsonValue} from '../json/normalize.js';
import {PlainUIError} from '../diagnostics/codes.js';
export type ScopeKind='app'|'local'|'loop'|'component'|'route';
export type BindingSource='state'|'store'|'derived'|'resource'|'action'|'props'|'route'|'alias'|'event';
export type ScopeOwner={readonly active:boolean;readonly signal:AbortSignal};
export type ScopeCell={value:JsonValue;version:number;readonly writable:boolean;readonly source:BindingSource};
export type ResourceHandle={refresh:()=>Promise<JsonValue>};
export interface Scope {
  readonly id:number;readonly kind:ScopeKind;readonly parent:Scope|null;readonly owner:ScopeOwner;readonly bindings:Map<string,ScopeCell>;readonly refs:Map<string,Element>;readonly resources:Map<string,ResourceHandle>;
}
export class ScopeFactory {
  private nextId=1;
  create(kind:ScopeKind,owner:ScopeOwner,parent:Scope|null=null):Scope {
    if(parent&&!parent.owner.active)throw new PlainUIError('OWNER_DISPOSED');
    return {id:this.nextId++,kind,parent,owner,bindings:new Map(),refs:new Map(),resources:new Map()};
  }
  component(owner:ScopeOwner,app:Scope):Scope {if(app.kind!=='app')throw new PlainUIError('REGISTRY_INVALID');return this.create('component',owner,app);}
}
