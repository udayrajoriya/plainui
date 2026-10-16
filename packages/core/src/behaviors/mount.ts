import {PlainUIError} from '../diagnostics/codes.js';
import type {ScopeApi} from '../public-api/types.js';
import type {BehaviorPlan} from './compile.js';

export interface BehaviorMountHooks {readonly registerCleanup:(cleanup:()=>void)=>void;readonly failOwner:()=>void}
export function mountBehaviors(element:Element,plan:BehaviorPlan,scope:ScopeApi,signal:AbortSignal,hooks:BehaviorMountHooks):void {
  try {for(const behavior of plan.behaviors){const result=behavior.factory(element,plan.options,scope,signal) as unknown;if(result&&typeof (result as {then?:unknown}).then==='function'){void Promise.resolve(result).catch(()=>{});throw new PlainUIError('BEHAVIOR_INVALID');}if(result!==undefined&&typeof result!=='function')throw new PlainUIError('BEHAVIOR_INVALID');if(typeof result==='function')hooks.registerCleanup(result as ()=>void);}}
  catch(error){hooks.failOwner();throw error instanceof PlainUIError?error:new PlainUIError('BEHAVIOR_INVALID');}
}
