import {PlainUIError} from '../diagnostics/codes.js';
import {normalizeJsBoundary,type JsonValue} from '../json/normalize.js';
import type {Owner} from '../ownership/owner.js';
import type {Scheduler} from '../scheduler/flush.js';
import type {ScopeApi} from '../public-api/types.js';
import type {CompiledCommand} from './parse.js';

export interface BuiltinEnvironment {owner:Owner;host:Element;scheduler:Scheduler;scopeApi:ScopeApi;services:{refresh?:(name:string)=>Promise<JsonValue>;reset?:()=>void|Promise<void>;navigate?:(url:string)=>void|Promise<void>;open?:(name:string)=>void|Promise<void>;close?:(name:string)=>void|Promise<void>;toast?:(message:string)=>void|Promise<void>}}
function string(value:JsonValue):string {if(typeof value!=='string'||!value.trim())throw new PlainUIError('COMMAND_ERROR');return value;}
export function emitFromHost(host:Element,name:string,detail:unknown):void {if(!name.trim()||['success','error','finally'].includes(name))throw new PlainUIError('COMMAND_ERROR');const value=normalizeJsBoundary(detail);const view=host.ownerDocument.defaultView;if(!view)throw new PlainUIError('COMMAND_ERROR');host.dispatchEvent(new view.CustomEvent(name,{bubbles:true,composed:true,detail:value}));}
async function focusRef(env:BuiltinEnvironment,name:string):Promise<void> {const target=env.scopeApi.refs.get(name);if(!(target instanceof HTMLElement)||!target.isConnected||target.matches(':disabled,[hidden]')||!target.matches('a[href],button,input,select,textarea,[tabindex]'))throw new PlainUIError('REF_INVALID');
  await new Promise<void>((resolve,reject)=>{if(!env.owner.active){reject(new PlainUIError('OWNER_DISPOSED'));return;}let settled=false;const cancel=env.scheduler.afterFlush(env.owner,()=>{if(settled)return;settled=true;env.owner.signal.removeEventListener('abort',abort);resolve();});const abort=()=>{if(settled)return;settled=true;cancel();reject(new PlainUIError('OWNER_DISPOSED'));};env.owner.signal.addEventListener('abort',abort,{once:true});});
  if(!env.owner.active)throw new PlainUIError('OWNER_DISPOSED');target.focus({preventScroll:true});
}
export async function runBuiltin(command:CompiledCommand,args:readonly JsonValue[],env:BuiltinEnvironment):Promise<boolean> {switch(command.name){
  case 'set':if(!command.writePath||args.length!==1)throw new PlainUIError('COMMAND_ERROR');env.scopeApi.set(command.writePath.source,args[0]);return true;
  case 'toggle':{if(!command.writePath||args.length)throw new PlainUIError('COMMAND_ERROR');const current=env.scopeApi.get(command.writePath.source);if(typeof current!=='boolean')throw new PlainUIError('COMMAND_ERROR');env.scopeApi.set(command.writePath.source,!current);return true;}
  case 'emit':if(args.length<1||args.length>2)throw new PlainUIError('COMMAND_ERROR');emitFromHost(env.host,string(args[0]!),args[1]??null);return true;
  case 'focus':if(args.length!==1)throw new PlainUIError('COMMAND_ERROR');await focusRef(env,string(args[0]!));return true;
  case 'refresh':if(args.length!==1)throw new PlainUIError('COMMAND_ERROR');if(!env.services.refresh)throw new PlainUIError('RESOURCE_UNKNOWN');await env.services.refresh(string(args[0]!));return true;
  case 'reset':if(args.length)throw new PlainUIError('COMMAND_ERROR');await env.services.reset?.();return true;
  case 'navigate':{if(args.length!==1)throw new PlainUIError('COMMAND_ERROR');const input=string(args[0]!);if(env.services.navigate){await env.services.navigate(input);return true;}const view=env.host.ownerDocument.defaultView;if(!view)throw new PlainUIError('MODULE_MISSING');let url:URL;try{url=new URL(input,view.location.href);}catch{throw new PlainUIError('URL_POLICY');}if(url.origin!==view.location.origin||!['http:','https:'].includes(url.protocol))throw new PlainUIError('URL_POLICY');view.location.assign(url.href);return true;}
  case 'open':case 'close':case 'toast':{if(args.length!==1)throw new PlainUIError('COMMAND_ERROR');const service=env.services[command.name];if(!service)throw new PlainUIError('MODULE_MISSING');await service(string(args[0]!));return true;}
  default:return false;
}}
