import {FORBIDDEN_KEYS,IDENTIFIER} from '../../schema/src/allowlists.js';
import {PlainUIError} from './diagnostics/codes.js';
import type {CustomFormatter} from './expression/evaluate.js';
import type {ScopeApi,CommandContext,AdapterDefinition,BehaviorFactory} from './public-api/types.js';
export type Command=(context:CommandContext,...args:readonly unknown[])=>unknown|Promise<unknown>;
const BUILTINS=new Set(['set','toggle','refresh','reset','navigate','emit','focus','open','close','toast','len','date','number','currency','json']);
export class ExtensionRegistry {
  private frozen=false;
  private commands=new Map<string,Command>();private formatters=new Map<string,CustomFormatter>();private behaviors=new Map<string,BehaviorFactory>();private adapters=new Map<string,AdapterDefinition>([['identity',Object.freeze({version:'1'})]]);
  private validate(name:string):void {if(this.frozen||!IDENTIFIER.test(name)||FORBIDDEN_KEYS.has(name)||BUILTINS.has(name)||this.commands.has(name)||this.formatters.has(name)||this.behaviors.has(name)||this.adapters.has(name))throw new PlainUIError('REGISTRY_INVALID');}
  registerCommand(name:string,command:Command):this {this.validate(name);if(typeof command!=='function')throw new PlainUIError('REGISTRY_INVALID');this.commands.set(name,command);return this;}
  registerFormatter(name:string,formatter:CustomFormatter):this {this.validate(name);if(typeof formatter!=='function')throw new PlainUIError('REGISTRY_INVALID');this.formatters.set(name,formatter);return this;}
  registerBehavior(name:string,behavior:BehaviorFactory):this {this.validate(name);if(typeof behavior!=='function')throw new PlainUIError('REGISTRY_INVALID');this.behaviors.set(name,behavior);return this;}
  registerAdapter(name:string,adapter:AdapterDefinition):this {this.validate(name);if(!adapter||typeof adapter.version!=='string'||!adapter.version.trim())throw new PlainUIError('REGISTRY_INVALID');this.adapters.set(name,Object.freeze({...adapter}));return this;}
  freeze():void {this.frozen=true;}
  getCommand(name:string):Command|undefined{return this.commands.get(name);}
  getFormatter(name:string):CustomFormatter|undefined{return this.formatters.get(name);}
  getBehavior(name:string):BehaviorFactory|undefined{return this.behaviors.get(name);}
  getAdapter(name:string):AdapterDefinition|undefined{return this.adapters.get(name);}
  formatterMap():ReadonlyMap<string,CustomFormatter>{return new Map(this.formatters);}
  get isFrozen():boolean{return this.frozen;}
}
