import type {JsonValue} from '../../../core/src/index.js';

export interface CacheEntry {readonly data:Readonly<JsonValue>;readonly acceptedAt:number;readonly adapter:{readonly name:string;readonly version:string};readonly epoch:number;readonly invalidationGeneration:number}
export function isFresh(entry:CacheEntry,ttlMs:number,now:number,epoch:number,invalidationGeneration:number):boolean {return Number.isFinite(ttlMs)&&ttlMs>0&&entry.epoch===epoch&&entry.invalidationGeneration===invalidationGeneration&&now-entry.acceptedAt<ttlMs;}
