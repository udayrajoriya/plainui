import {PlainUIError} from '../../../core/src/index.js';
import type {NormalizedRequestError} from './error.js';
import {identityAdapter} from './identity.js';

export interface AdapterContext {readonly signal:AbortSignal;readonly timeoutMs:number;readonly isCurrent:()=>boolean;readonly metadata:Readonly<Record<string,unknown>>}
export interface ResponseMetadata {readonly status:number;readonly statusText:string;readonly url:string;readonly headers:Readonly<Record<string,string>>}
export interface RequestAdapter {readonly version:string;readonly prepare?:(draft:unknown,context:AdapterContext)=>unknown|Promise<unknown>;readonly success?:(body:unknown,meta:ResponseMetadata,context:AdapterContext)=>unknown|Promise<unknown>;readonly error?:(error:NormalizedRequestError,body:unknown,meta:ResponseMetadata|null,context:AdapterContext)=>unknown|Promise<unknown>}
export class AdapterRegistry {private readonly adapters=new Map<string,RequestAdapter>([['identity',identityAdapter]]);private frozen=false;
  register(name:string,adapter:RequestAdapter):this {if(this.frozen||!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)||this.adapters.has(name)||!adapter||typeof adapter.version!=='string'||!adapter.version.trim()||['prepare','success','error'].some(key=>{const hook=adapter[key as keyof RequestAdapter];return hook!==undefined&&typeof hook!=='function';}))throw new PlainUIError('REGISTRY_INVALID');this.adapters.set(name,Object.freeze({...adapter}));return this;}
  get(name:string):RequestAdapter {const adapter=this.adapters.get(name);if(!adapter)throw new PlainUIError('REGISTRY_INVALID');return adapter;}
  freeze():void {this.frozen=true;}
}
