import {PlainUIError} from '../diagnostics/codes.js';
import {detachedSnapshot} from '../json/freeze.js';
import {normalizeJsBoundary,type JsonValue} from '../json/normalize.js';
import type {Owner} from '../ownership/owner.js';
import type {Scheduler} from '../scheduler/flush.js';
import {lookupRef} from '../scope/refs.js';
import type {Scope} from '../scope/scope.js';
import type {StateStore} from '../state/store.js';
import type {ScopeApi} from '../public-api/types.js';
import {emitFromHost} from './builtins.js';

export interface CommandServices {refresh?:(name:string)=>Promise<JsonValue>;reset?:(name:string)=>void|Promise<void>;navigate?:(url:string)=>void|Promise<void>;open?:(name:string)=>void|Promise<void>;close?:(name:string)=>void|Promise<void>;toast?:(message:string)=>void|Promise<void>}
export function createScopeApi(owner:Owner,scope:Scope,store:StateStore,scheduler:Scheduler,host:Element,services:CommandServices):ScopeApi {const live=()=>{if(!owner.active)throw new PlainUIError('OWNER_DISPOSED');};return {
  signal:owner.signal,
  get(path){live();return detachedSnapshot(store.read(path));},
  set(path,value){live();store.write(path,value);},
  batch<T>(callback:()=>T):T {live();return store.batch(callback);},
  async refresh(name){live();if(!services.refresh)throw new PlainUIError('RESOURCE_UNKNOWN');return services.refresh(name);},
  refs:{get(name){live();return lookupRef(scope,name);}},
  emit(name,detail){live();emitFromHost(host,name,normalizeJsBoundary(detail));},
  afterFlush(callback){live();return scheduler.afterFlush(owner,callback);},
};}
