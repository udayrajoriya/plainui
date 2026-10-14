import {PlainUIError} from '../diagnostics/codes.js';
import {normalizeJson,type JsonValue} from '../json/normalize.js';
import type {ScopeCell} from '../scope/scope.js';
import type {Scheduler} from '../scheduler/flush.js';

export type StorageKind='local'|'session';
export interface PersistenceOptions {rootName:string;version:number;key:string;kind:StorageKind;cell:ScopeCell;defaults:JsonValue;origin?:string;owner:{readonly active:boolean;readonly signal?:AbortSignal};localStorage:Storage;sessionStorage:Storage}
const claims=new Map<string,PersistenceBinding>();
function sameKeys(left:JsonValue,right:JsonValue):boolean {if(!left||!right||Array.isArray(left)||Array.isArray(right)||typeof left!=='object'||typeof right!=='object')return false;const a=Object.keys(left).sort();const b=Object.keys(right).sort();return a.length===b.length&&a.every((key,index)=>key===b[index]);}
export class PersistenceBinding {
  readonly storageKey:string;private readonly storage:Storage;private readonly claimId:string;private cancelled=false;private queued=false;
  constructor(private readonly options:PersistenceOptions,private readonly scheduler:Scheduler,private readonly onError:(error:unknown)=>void){
    if(!options.rootName||!options.key||!Number.isSafeInteger(options.version)||options.version<0||!['local','session'].includes(options.kind)||!['state','store'].includes(options.cell.source)||!sameKeys(options.defaults,options.cell.value))throw new PlainUIError('CONFIG_INVALID');
    this.storageKey=`plainui:${encodeURIComponent(options.rootName)}:v${options.version}:${encodeURIComponent(options.key)}`;
    this.claimId=`${options.origin??globalThis.location?.origin??''}|${this.storageKey}`;
    if(claims.has(this.claimId))throw new PlainUIError('CONFIG_INVALID');claims.set(this.claimId,this);
    this.storage=options.kind==='local'?options.localStorage:options.sessionStorage;options.owner.signal?.addEventListener('abort',()=>this.dispose(),{once:true});
  }
  restore():void {if(this.cancelled)return;let raw:string|null;try{raw=this.storage.getItem(this.storageKey);}catch{this.onError(new PlainUIError('PERSISTENCE_STORAGE'));return;}if(raw===null)return;try {const envelope=JSON.parse(raw) as {version?:unknown;value?:unknown};if(!envelope||envelope.version!==this.options.version)throw new Error();const value=normalizeJson(envelope.value);if(!sameKeys(this.options.defaults,value))throw new Error();this.options.cell.value=value;this.options.cell.version++;}catch{this.onError(new PlainUIError('PERSISTENCE_INVALID'));}}
  changed():void {if(this.cancelled||this.queued||!this.options.owner.active)return;this.queued=true;this.scheduler.afterFlush(this.options.owner,()=>{this.queued=false;if(!this.cancelled)this.write();});}
  private write():void {try {const value=normalizeJson(this.options.cell.value);this.storage.setItem(this.storageKey,JSON.stringify({version:this.options.version,value}));}catch{this.onError(new PlainUIError('PERSISTENCE_STORAGE'));}}
  dispose():void {if(this.cancelled)return;this.cancelled=true;claims.delete(this.claimId);}
}
