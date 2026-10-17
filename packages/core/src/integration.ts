/** Private service contracts shared across package boundaries. */
import type {ResolvedOptions} from './config.js';
import type {JsonValue} from './json/normalize.js';
import type {ResourceHandle} from './scope/scope.js';

export interface ResourceMount {readonly name:string;readonly element:Element;readonly directives:Readonly<Record<string,string>>;readonly owner:{readonly active:boolean;readonly signal:AbortSignal};readonly options:ResolvedOptions;readonly getEpoch:()=>number;readonly read:(name:string)=>{found:boolean;value:JsonValue};readonly evaluate:(expression:string)=>{ok:true;value:JsonValue;dependencies:readonly string[]}|{ok:false;code:string};readonly watch:(paths:readonly string[],notify:()=>void)=>()=>void;readonly publish:(value:JsonValue)=>void;readonly afterFlush:(callback:()=>void)=>void;readonly lifecycle:(name:'success'|'error'|'finally',detail:JsonValue)=>void;readonly diagnose:(error:unknown)=>void;readonly adapter:(name:string)=>unknown}
export interface MountedResource extends ResourceHandle {activate():void;currentKey():string|null;dispose():void;resetSession():void}
export interface ResourceInspection {readonly id:string;readonly status:'idle'|'loading'|'success'|'error';readonly loading:boolean;readonly refreshing:boolean;readonly stale:boolean;readonly updatedAt:number|null;readonly error:null|{readonly kind:string;readonly code:string|null;readonly status:number|null}}
export interface ResourceRootInspection {readonly resources:readonly ResourceInspection[];readonly cacheEntries:number;readonly transports:number;readonly consumers:number;readonly timers:number}
export interface ResourceRoot {register(mount:ResourceMount):MountedResource;invalidate(keys:readonly string[]):void;dispose():void;resetSession():void;inspect():ResourceRootInspection;readonly cacheEntries:number}
export interface ActionMount {readonly plan:unknown;readonly element:Element;readonly owner:{readonly active:boolean;readonly signal:AbortSignal};readonly options:ResolvedOptions;readonly getEpoch:()=>number;readonly read:(name:string)=>{found:boolean;value:JsonValue};readonly publish:(value:JsonValue)=>void;readonly afterFlush:(callback:()=>void)=>void;readonly lifecycle:(name:'success'|'error'|'finally',detail:JsonValue)=>Promise<void>;readonly resolveResourceName:(name:string)=>string|null;readonly invalidateKeys:(keys:readonly string[])=>void;readonly diagnose:(error:unknown)=>void;readonly adapter:(name:string)=>unknown;readonly htmlHandler?:((markup:string,signal:AbortSignal)=>JsonValue|Promise<JsonValue>)}
export interface MountedAction {dispose():void;resetSession():void;inspect():Readonly<{pending:boolean;timers:number;listeners:number}>}
export interface ModelMount {readonly element:Element;readonly path:string;readonly owner:{readonly active:boolean;readonly signal:AbortSignal};readonly read:()=>JsonValue;readonly write:(value:JsonValue)=>void;readonly watch:(notify:()=>void)=>()=>void;readonly diagnose:(error:unknown)=>void}
export interface MountedModel {update():void;dispose():void}
export interface ModelService {bind(mount:ModelMount):MountedModel}
export interface ComponentRoot {discover():void;loadImports(urls:readonly string[],timeoutMs:number,signal:AbortSignal,record?:(url:string,fragment:DocumentFragment)=>void):Promise<void>;freeze():void;dispose():void;definition(name:string):unknown}
export interface ComponentService {createRoot(root:Element,diagnose:(error:unknown)=>void):ComponentRoot}
export interface NavigationService {beforeNavigate(guard:(url:string)=>boolean|Promise<boolean>):()=>void;navigate?(url:string):Promise<void>}
export interface UiService {open(target:Element|undefined):void|Promise<void>;close(target:Element|undefined):void|Promise<void>;toast(message:string):void|Promise<void>}
export interface FragmentActionService {handle(input:{readonly root:Element;readonly action:Element;readonly actionOwner:{readonly active:boolean;readonly signal:AbortSignal};readonly markup:string;readonly targetRef:string;readonly swap:string;readonly enhance:boolean;readonly signal:AbortSignal;readonly expectedEpoch:number;readonly getEpoch:()=>number;readonly lookup:(name:string)=>Element|undefined}):JsonValue|Promise<JsonValue>}
export interface ModuleRuntime {mount(root:Element,options:ResolvedOptions):void;unmount():void;readonly navigation?:NavigationService;readonly ui?:UiService;readonly fragments?:FragmentActionService}
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
  activate?(mount:ActionMount):MountedAction;
}

export interface RuntimeServices {
  readonly request: RequestService;
  readonly resources?:ResourceService;
  readonly models?:ModelService;
  readonly components?:ComponentService;
  readonly dom: DomService;
  readonly actions: ActionService;
  readonly navigation?: NavigationService;
}
