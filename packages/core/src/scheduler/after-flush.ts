import type {Scheduler} from './flush.js';
export function afterFlush(scheduler:Scheduler,owner:{readonly active:boolean},callback:()=>void):()=>void {return scheduler.afterFlush(owner,callback);}
