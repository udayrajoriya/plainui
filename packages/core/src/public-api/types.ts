import type {JsonValue} from '../json/normalize.js';
import type {Diagnostic} from '../diagnostics/emit.js';
export type ReadonlyJson=JsonValue;
export type ScopeApi={readonly signal:AbortSignal;get(path:string):ReadonlyJson;set(path:string,value:unknown):void;batch<T>(fn:()=>T):T;refresh(name:string):Promise<JsonValue>;readonly refs:{get(name:string):Element|undefined};emit(name:string,detail:unknown):void;afterFlush(fn:()=>void):()=>void};
export type SafeEventSnapshot={type:string;key:string|null;button:number|null;value:string|null;checked:boolean|null;detail:JsonValue|null};
export type CommandContext={readonly scope:ScopeApi;readonly signal:AbortSignal;readonly host:Element;readonly event:SafeEventSnapshot|null;readonly canceled:boolean};
export type BehaviorFactory=(element:Element,options:Readonly<JsonValue>,scope:ScopeApi,signal:AbortSignal)=>void|(()=>void);
export type AdapterDefinition={readonly version:string;readonly prepare?:(draft:unknown,context:unknown)=>unknown|Promise<unknown>;readonly success?:(body:JsonValue,context:unknown)=>unknown|Promise<unknown>;readonly error?:(error:unknown,context:unknown)=>unknown|Promise<unknown>};
export type DiagnosticListener=(diagnostic:Diagnostic)=>void;
