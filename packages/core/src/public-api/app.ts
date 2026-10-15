import type {DiagnosticListener} from '../diagnostics/emit.js';
import type {InspectorSnapshot} from '../diagnostics/inspector.js';
import type {CustomFormatter} from '../expression/evaluate.js';
import type {JsonValue} from '../json/normalize.js';
import type {Command} from '../registry.js';
import type {AdapterDefinition,BehaviorFactory,ReadonlyJson} from './types.js';

/** Stable application-scope API. Registration is available only before mount. */
export interface PlainUIApp {
  readonly status:'created'|'compiling'|'mounted'|'unmounting'|'unmounted'|'failed';
  readonly ready:Promise<void>;
  readonly rootElement:Element|null;
  mount(root:Element):this;
  registerCommand(name:string,command:Command):this;
  registerFormatter(name:string,formatter:CustomFormatter):this;
  registerBehavior(name:string,behavior:BehaviorFactory):this;
  registerAdapter(name:string,adapter:AdapterDefinition):this;
  beforeNavigate(guard:(url:string)=>boolean|Promise<boolean>):()=>void;
  onDiagnostic(listener:DiagnosticListener):()=>void;
  inspect():InspectorSnapshot;
  get(path:string):ReadonlyJson;
  set(path:string,value:unknown):void;
  batch<T>(callback:()=>T):T;
  refresh(name:string):Promise<JsonValue>;
  resetSession():void;
  unmount():void;
}
