import {PlainUIError} from '../diagnostics/codes.js';
import {evaluate,type EvaluationBudget} from '../expression/evaluate.js';
import {normalizeJson} from '../json/normalize.js';
import type {Owner} from '../ownership/owner.js';
import type {ExtensionRegistry} from '../registry.js';
import type {Scheduler} from '../scheduler/flush.js';
import {lexicalReader} from '../scope/lookup.js';
import type {Scope} from '../scope/scope.js';
import type {StateStore} from '../state/store.js';
import {runBuiltin} from './builtins.js';
import {createScopeApi,type CommandServices} from './context.js';
import type {CompiledCommand} from './parse.js';
import type {EventSnapshot} from './snapshot.js';

export interface CommandEnvironment {owner:Owner;scope:Scope;store:StateStore;scheduler:Scheduler;host:Element;registry:ExtensionRegistry;services:CommandServices;locale:string;timeZone:string;onError:(error:unknown)=>void}
export async function executeCommands(commands:readonly CompiledCommand[],snapshot:EventSnapshot,budget:EvaluationBudget,env:CommandEnvironment):Promise<void> {
  const scopeApi=createScopeApi(env.owner,env.scope,env.store,env.scheduler,env.host,env.services);
  const lexical=lexicalReader(env.scope);
  const reader={read:(name:string)=>name==='$event'?{found:true,value:normalizeJson(snapshot)}:lexical.read(name)};
  for(const command of commands){
    if(!env.owner.active)return;
    try {
      const args=command.arguments.map(ast=>{const result=evaluate(ast,reader,{locale:env.locale,timeZone:env.timeZone,formatters:env.registry.formatterMap(),budget});if(!result.ok)throw new PlainUIError(result.code);return result.value;});
      const handled=await runBuiltin(command,args,{owner:env.owner,host:env.host,scheduler:env.scheduler,scopeApi,services:env.services});
      if(!handled){const custom=env.registry.getCommand(command.name);if(!custom)throw new PlainUIError('COMMAND_ERROR');await custom({scope:scopeApi,signal:env.owner.signal,host:env.host,event:snapshot,canceled:!env.owner.active},...args);}
    }catch(error){if(env.owner.active)env.onError(error instanceof PlainUIError?error:new PlainUIError('COMMAND_ERROR'));return;}
  }
}
