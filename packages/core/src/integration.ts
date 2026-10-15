/** Private service contracts shared across package boundaries. */
import type {ResolvedOptions} from './config.js';
import type {JsonValue} from './json/normalize.js';
import type {ResourceHandle} from './scope/scope.js';

export interface ResourceMount {readonly name:string;readonly element:Element;readonly directives:Readonly<Record<string,string>>;readonly owner:{readonly active:boolean;readonly signal:AbortSignal};readonly options:ResolvedOptions;readonly getEpoch:()=>number;readonly read:(name:string)=>{found:boolean;value:JsonValue};readonly evaluate:(expression:string)=>{ok:true;value:JsonValue;dependencies:readonly string[]}|{ok:false;code:string};readonly watch:(paths:readonly string[],notify:()=>void)=>()=>void;readonly publish:(value:JsonValue)=>void;readonly afterFlush:(callback:()=>void)=>void;readonly lifecycle:(name:'success'|'error'|'finally',detail:JsonValue)=>void;readonly diagnose:(error:unknown)=>void;readonly adapter:(name:string)=>unknown}
export interface MountedResource extends ResourceHandle {activate():void;dispose():void;resetSession():void}
export interface ResourceRoot {register(mount:ResourceMount):MountedResource;dispose():void;resetSession():void;readonly cacheEntries:number}
export interface ResourceService {createRoot(id:string,options:ResolvedOptions):ResourceRoot}
export interface RequestService {
  send(request: Request, signal: AbortSignal): Promise<Response>;
}

export interface DomService {
  parseInert(markup: string, ownerDocument: Document): DocumentFragment;
}

export interface ActionService {
  submit(form: HTMLFormElement, signal: AbortSignal): Promise<unknown>;
  compile?(input:{readonly tagName:string;readonly directives:Readonly<Record<string,string>>;readonly fragmentsInstalled:boolean;readonly nativeForm?:{readonly action:string|null;readonly method:string|null}}):unknown;
}

export interface RuntimeServices {
  readonly request: RequestService;
  readonly resources?:ResourceService;
  readonly dom: DomService;
  readonly actions: ActionService;
  readonly navigation?: {beforeNavigate(guard:(url:string)=>boolean|Promise<boolean>):()=>void};
}
