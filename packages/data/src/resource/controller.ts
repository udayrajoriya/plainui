import {detachedSnapshot,type JsonValue} from '../../../core/src/index.js';
import type {NormalizedRequestError} from '../adapter/error.js';
import {emptyData,IDLE_RESOURCE,type ResourceRecord} from './record.js';

export interface ResourceLoad {readonly data:JsonValue;readonly acceptedAt:number}
export interface ResourceControllerOptions {readonly owner:{readonly active:boolean;readonly signal?:AbortSignal};readonly load:(key:string,generation:number,signal:AbortSignal)=>Promise<ResourceLoad>;readonly publish:(record:ResourceRecord)=>void;readonly afterFlush:(callback:()=>void)=>void;readonly lifecycle?:(name:'success'|'error'|'finally',detail:JsonValue)=>void;readonly now?:()=>number;readonly ttlMs:number}
function canceled():DOMException{return new DOMException('Operation canceled.','AbortError');}
/** A resource owns its settled value independently of the root's reusable cache. */
export class ResourceController {
  record:ResourceRecord=IDLE_RESOURCE;key:string|null=null;generation=0;private pending:AbortController|null=null;private settled:ResourceRecord=IDLE_RESOURCE;private disposed=false;
  constructor(private readonly options:ResourceControllerOptions){options.publish(this.record);}
  private set(record:ResourceRecord):void {this.record=Object.freeze(record);this.options.publish(this.record);}
  setKey(key:string|null):void {if(this.disposed||key===this.key)return;this.cancel();this.key=key;this.generation++;this.settled=IDLE_RESOURCE;this.set(IDLE_RESOURCE);}
  markStale():void {if(!this.disposed&&this.key&&this.record.updatedAt!==null)this.set({...this.record,stale:true});}
  updateFreshness():void {if(this.disposed||this.record.updatedAt===null)return;const now=this.options.now?.()??Date.now();const stale=!(this.options.ttlMs>0&&now-this.record.updatedAt<this.options.ttlMs);if(stale!==this.record.stale)this.set({...this.record,stale});}
  async refresh():Promise<JsonValue> {if(this.disposed||!this.options.owner.active)throw canceled();const key=this.key;if(key===null)throw new Error('RESOURCE_SUSPENDED');this.cancel();const generation=++this.generation;const controller=new AbortController();this.pending=controller;const hadSuccess=this.settled.updatedAt!==null;this.set({...this.settled,status:hadSuccess?'success':'loading',loading:!hadSuccess,refreshing:hadSuccess,error:null});
    try{const result=await this.options.load(key,generation,controller.signal);if(!this.current(key,generation,controller))throw canceled();const data=detachedSnapshot(result.data);const now=this.options.now?.()??Date.now();const stale=!(this.options.ttlMs>0&&now-result.acceptedAt<this.options.ttlMs);this.settled=Object.freeze({data,status:'success',loading:false,refreshing:false,error:null,empty:emptyData(result.data),stale,updatedAt:result.acceptedAt});this.pending=null;this.set(this.settled);await this.waitFlush();if(this.disposed||!this.options.owner.active||this.key!==key||this.generation!==generation)throw canceled();this.emit('success',data as JsonValue);this.emit('finally',data as JsonValue);return data as JsonValue;
    }catch(error){if(!this.current(key,generation,controller)||controller.signal.aborted){if(this.pending===controller){this.pending=null;this.set(this.settled);}if(this.options.owner.active)this.emit('finally',null);throw canceled();}this.pending=null;const failure=error as NormalizedRequestError;this.set({...this.settled,status:'error',loading:false,refreshing:false,error:failure});this.settled=this.record;await this.waitFlush();if(this.disposed||!this.options.owner.active||this.key!==key||this.generation!==generation)throw canceled();this.emit('error',failure as unknown as JsonValue);this.emit('finally',failure as unknown as JsonValue);throw failure;}
  }
  private current(key:string,generation:number,controller:AbortController):boolean{return !this.disposed&&this.options.owner.active&&this.key===key&&this.generation===generation&&this.pending===controller;}
  private waitFlush():Promise<void> {return new Promise((resolve,reject)=>{const signal=this.options.owner.signal;if(signal?.aborted||!this.options.owner.active){reject(canceled());return;}const abort=()=>reject(canceled());signal?.addEventListener('abort',abort,{once:true});this.options.afterFlush(()=>{signal?.removeEventListener('abort',abort);resolve();});});}
  private emit(name:'success'|'error'|'finally',detail:JsonValue):void {if(this.options.owner.active)try{this.options.lifecycle?.(name,detail);}catch{/* Lifecycle diagnostics are handled by the dispatcher. */}}
  cancel():void {if(!this.pending)return;const controller=this.pending;this.pending=null;controller.abort();if(!this.disposed)this.set(this.settled);}
  dispose():void {this.disposed=true;this.cancel();}
}
