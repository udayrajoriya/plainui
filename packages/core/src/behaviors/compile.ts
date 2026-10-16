import {PlainUIError} from '../diagnostics/codes.js';
import {detachedSnapshot} from '../json/freeze.js';
import type {JsonValue} from '../json/normalize.js';
import type {BehaviorFactory} from '../public-api/types.js';

export interface CompiledBehavior {readonly name:string;readonly factory:BehaviorFactory}
export interface BehaviorPlan {readonly behaviors:readonly CompiledBehavior[];readonly options:Readonly<JsonValue>}
function fail():never {throw new PlainUIError('BEHAVIOR_INVALID');}
export function compileBehaviors(use:string,optionsSource:string|undefined,resolve:(name:string)=>BehaviorFactory|undefined):BehaviorPlan {
  const names=use.trim().split(/\s+/u).filter(Boolean);if(!names.length||new Set(names).size!==names.length)fail();
  const behaviors=names.map(name=>{const factory=resolve(name);if(!factory)fail();return Object.freeze({name,factory});});
  let options:unknown={};try{options=optionsSource===undefined?{}:JSON.parse(optionsSource);}catch{fail();}
  if(!options||typeof options!=='object'||Array.isArray(options)||Object.getPrototypeOf(options)!==Object.prototype)fail();
  return Object.freeze({behaviors:Object.freeze(behaviors),options:detachedSnapshot(options as JsonValue) as Readonly<JsonValue>});
}
