import {detachedSnapshot,type JsonValue} from '../../../core/src/index.js';
import {isFresh,type CacheEntry} from './entry.js';

/** Root-local bounded settled-value cache. Controllers retain their own data independently. */
export class ResourceCache {
  private readonly entries=new Map<string,CacheEntry>();
  constructor(readonly maxEntries:number){if(!Number.isSafeInteger(maxEntries)||maxEntries<0)throw new RangeError('Invalid cache capacity.');}
  get size():number{return this.entries.size;}
  peek(key:string):CacheEntry|undefined{return this.entries.get(key);}
  read(key:string,ttlMs:number,now:number,epoch:number,generation:number):CacheEntry|undefined {const entry=this.entries.get(key);if(!entry||!isFresh(entry,ttlMs,now,epoch,generation))return undefined;this.entries.delete(key);this.entries.set(key,entry);return entry;}
  put(key:string,data:JsonValue,acceptedAt:number,adapter:{readonly name:string;readonly version:string},epoch:number,invalidationGeneration:number):CacheEntry|undefined {if(this.maxEntries===0)return undefined;if(!Number.isFinite(acceptedAt)||!Number.isSafeInteger(epoch)||!Number.isSafeInteger(invalidationGeneration))throw new RangeError('Invalid cache metadata.');const entry:CacheEntry=Object.freeze({data:detachedSnapshot(data),acceptedAt,adapter:Object.freeze({...adapter}),epoch,invalidationGeneration});this.entries.delete(key);this.entries.set(key,entry);while(this.entries.size>this.maxEntries)this.entries.delete(this.entries.keys().next().value!);return entry;}
  delete(key:string):void {this.entries.delete(key);}
  clear():void {this.entries.clear();}
  keys():readonly string[] {return [...this.entries.keys()];}
}
