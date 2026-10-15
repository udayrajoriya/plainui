import {PlainUIError} from '../diagnostics/codes.js';
import {normalizeJson,type JsonValue} from '../json/normalize.js';
import {parsePath,readPath,replaceWritablePath,type ParsedPath} from './path.js';
import {lookupBinding} from '../scope/lookup.js';
import type {Scope,ScopeCell} from '../scope/scope.js';
import {affects,pathKey,type Dependency,type DependencyKind} from './dependencies.js';
import {publishCell} from './cell.js';

export interface StateObserver {readonly dependencies:Set<Dependency>;readonly invalidate:()=>void;readonly owner?:{readonly active:boolean}}
export class StateStore {
  private static readonly observers=new Set<StateObserver>();private tracking:Set<Dependency>|null=null;private depth=0;private pending=new Set<StateObserver>();
  static get activeObserverCount():number {return [...StateStore.observers].filter(observer=>observer.owner?.active??true).length;}
  static notifyPublished(cell:ScopeCell,path:string):void {for(const observer of StateStore.observers)if((observer.owner?.active??true)&&[...observer.dependencies].some(dep=>affects(dep,cell,path)))observer.invalidate();}
  constructor(readonly scope:Scope){}
  private resolve(path:ParsedPath):ScopeCell {const cell=lookupBinding(this.scope,path.root);if(!cell)throw new PlainUIError('PATH_INVALID');return cell;}
  read(pathText:string,kind:DependencyKind='value'):JsonValue {const path=parsePath(pathText,{writable:false});const cell=this.resolve(path);if(this.tracking)this.tracking.add({cell,path:pathKey(path),kind});return readPath(new Map([[path.root,cell]]),path);}
  track<T>(observer:StateObserver,evaluate:()=>T):T {
    const previous=this.tracking;const captured=new Set<Dependency>();this.tracking=captured;
    try {const value=evaluate();observer.dependencies.clear();for(const dependency of captured)observer.dependencies.add(dependency);StateStore.observers.add(observer);return value;}
    finally {this.tracking=previous;}
  }
  replaceDependencies(observer:StateObserver,reads:Iterable<{path:string;kind?:DependencyKind}>):void {
    const next=new Set<Dependency>();for(const read of reads){const path=parsePath(read.path,{writable:false});next.add({cell:this.resolve(path),path:pathKey(path),kind:read.kind??'value'});}
    observer.dependencies.clear();for(const dependency of next)observer.dependencies.add(dependency);StateStore.observers.add(observer);
  }
  untrack(observer:StateObserver):void {StateStore.observers.delete(observer);this.pending.delete(observer);observer.dependencies.clear();}
  write(pathText:string,input:unknown):void {
    if(!this.scope.owner.active)throw new PlainUIError('OWNER_DISPOSED');const path=parsePath(pathText);const cell=this.resolve(path);const old=readPath(new Map([[path.root,cell]]),path);
    const result=replaceWritablePath(cell,path,input);const replacement=path.segments.length?readPath(new Map([[path.root,{value:result.value,writable:true}]]),path):result.value;
    if(Object.is(old,replacement))return;
    publishCell(cell,result.value);const written=pathKey(path);
    for(const observer of StateStore.observers)if((observer.owner?.active??true)&&[...observer.dependencies].some(dep=>affects(dep,cell,written)))this.pending.add(observer);
    if(!this.depth)this.deliver();
  }
  /** Internal alias/context publication; public writes still pass through write(). */
  publish(name:string,input:unknown):void {if(!this.scope.owner.active)throw new PlainUIError('OWNER_DISPOSED');const path=parsePath(name,{writable:false});if(path.segments.length)throw new PlainUIError('PATH_INVALID');const cell=this.resolve(path);const value=normalizeJson(input);if(Object.is(cell.value,value))return;publishCell(cell,value);const written=pathKey(path);for(const observer of StateStore.observers)if((observer.owner?.active??true)&&[...observer.dependencies].some(dep=>affects(dep,cell,written)))this.pending.add(observer);if(!this.depth)this.deliver();}
  private deliver():void {const pending=[...this.pending];this.pending.clear();for(const observer of pending)if(observer.owner?.active??true)observer.invalidate();}
  batch<T>(callback:()=>T):T {this.depth++;try{const result=callback();if(result!==null&&(typeof result==='object'||typeof result==='function')&&typeof (result as {then?:unknown}).then==='function')throw new PlainUIError('BATCH_ASYNC');return result;}finally{this.depth--;if(!this.depth)this.deliver();}}
}
