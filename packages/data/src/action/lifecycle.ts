import {detachedSnapshot,type JsonValue} from '../../../core/src/index.js';
import type {ActionRecord} from './record.js';
import type {ActionOutcome} from './controller.js';

export type LifecycleName='success'|'error'|'finally';
export function lifecycleDetail(record:ActionRecord,outcome:ActionOutcome|null,event:JsonValue,canceled:boolean):JsonValue {return detachedSnapshot({result:outcome?.kind==='success'?outcome.value:null,error:outcome?.kind==='error'?outcome.error as unknown as JsonValue:null,action:record as unknown as JsonValue,event,canceled}) as JsonValue;}
export async function runLifecycle(owner:{readonly active:boolean},name:LifecycleName,detail:JsonValue,run:(name:LifecycleName,detail:JsonValue)=>Promise<void>,diagnose:(error:unknown)=>void):Promise<void> {if(!owner.active)return;try{await run(name,detail);}catch(error){if(owner.active)diagnose(error);}}
