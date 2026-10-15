import type {ResourceCache} from './lru.js';

export interface CacheConsumer {readonly active:()=>boolean;readonly automatic:boolean;readonly stale:()=>void;readonly cancelOlder:(generation:number)=>void;readonly revalidate:(generation:number)=>void}
interface Refresh {readonly generation:number;readonly promise:Promise<unknown>}
/** Invalidations are keyed by the resolved request identity, not declaration name. */
export class CacheInvalidator {
  private readonly generations=new Map<string,number>();
  private readonly consumers=new Map<string,Set<CacheConsumer>>();
  private readonly refreshing=new Map<string,Refresh>();
  constructor(private readonly cache:ResourceCache){}
  generation(key:string):number{return this.generations.get(key)??0;}
  attach(key:string,consumer:CacheConsumer):()=>void {let set=this.consumers.get(key);if(!set){set=new Set();this.consumers.set(key,set);}set.add(consumer);return ()=>{set!.delete(consumer);if(!set!.size)this.consumers.delete(key);};}
  /** Mutation invalidation always advances; each attached active consumer is notified once. */
  invalidate(key:string):number {const generation=this.generation(key)+1;this.generations.set(key,generation);this.cache.delete(key);this.refreshing.delete(key);for(const consumer of this.consumers.get(key)??[]){if(!consumer.active())continue;consumer.cancelOlder(generation);consumer.stale();if(consumer.automatic)consumer.revalidate(generation);}return generation;}
  /** Explicit calls share the latest revalidation; a mutation supersedes it. */
  refresh<T>(key:string,run:(generation:number)=>Promise<T>):Promise<T> {const current=this.refreshing.get(key);if(current&&current.generation===this.generation(key))return current.promise as Promise<T>;const generation=this.invalidate(key);let pending!:Promise<T>;pending=Promise.resolve().then(()=>run(generation)).then(value=>{if(this.generation(key)!==generation)throw new DOMException('Operation superseded.','AbortError');return value;}).finally(()=>{if(this.refreshing.get(key)?.promise===pending)this.refreshing.delete(key);});this.refreshing.set(key,{generation,promise:pending});return pending;}
  accepts(key:string,generation:number):boolean {return this.generation(key)===generation;}
  clear():void {this.generations.clear();this.refreshing.clear();this.consumers.clear();this.cache.clear();}
}
