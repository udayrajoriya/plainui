import {resolveConfiguration,type ResolvedOptions} from './config.js';
import {compileTree,type CompileResult} from './compiler/walk.js';
import type {BindingPlan} from './compiler/plan.js';
import {PlainUIError} from './diagnostics/codes.js';
import {DiagnosticBus,type DiagnosticListener} from './diagnostics/emit.js';
import {OwnerTree} from './ownership/owner.js';
import {Scheduler} from './scheduler/flush.js';
import {ScopeFactory,type Scope} from './scope/scope.js';
import {StateStore} from './state/store.js';
import {declareBinding} from './scope/declarations.js';
import {normalizeJson} from './json/normalize.js';
import {parseExpression} from './expression/parse.js';
import {evaluate} from './expression/evaluate.js';
import {lexicalReader} from './scope/lookup.js';
import {setText} from './bindings/text.js';
import {setAttribute} from './bindings/attribute.js';
import {ClassBinding} from './bindings/class.js';
import {setShow} from './bindings/show.js';
import type {StateObserver} from './state/store.js';
import {parseDeveloperImport} from './html/inert.js';
import {collectConditionalChains,ConditionalChain} from './structure/conditional.js';
import {parseFor} from './structure/for-parser.js';
import {KeyedList} from './structure/keyed-list.js';
import type {Owner} from './ownership/owner.js';
import {RootObserver} from './compiler/observe.js';
import {ExtensionRegistry} from './registry.js';
import type {RuntimeServices} from './integration.js';
import {registerRef} from './scope/refs.js';
import {parseCommands} from './commands/parse.js';
import {attachEventHandler,parseEventDirective} from './commands/handler.js';
import {executeCommands} from './commands/execute.js';
import type {CommandServices} from './commands/context.js';
import {detachedSnapshot} from './json/freeze.js';
import {lookupResource} from './scope/lookup.js';
import type {Command} from './registry.js';
import type {CustomFormatter} from './expression/evaluate.js';
import type {BehaviorFactory,AdapterDefinition} from './public-api/types.js';
import type {InspectorSnapshot} from './diagnostics/inspector.js';
import type {PlainUIApp} from './public-api/app.js';

export type AppStatus='created'|'compiling'|'mounted'|'unmounting'|'unmounted'|'failed';
const mountSymbol=Symbol.for('plainui.document.mounts.v1');
type MountRegistry={roots:Map<Element,App>;names:Map<string,App>;serial:number};
function registry(document:Document):MountRegistry {const host=document as Document&{[mountSymbol]?:MountRegistry};return host[mountSymbol]??(host[mountSymbol]={roots:new Map(),names:new Map(),serial:0});}
export class App implements PlainUIApp {
  status:AppStatus='created';readonly ready:Promise<void>;private resolveReady!:()=>void;private rejectReady!:(reason:unknown)=>void;
  private root:Element|null=null;private name='';private registry:MountRegistry|null=null;private tree:OwnerTree|null=null;private scheduler:Scheduler|null=null;private scope:Scope|null=null;private state:StateStore|null=null;private bus:DiagnosticBus|null=null;private observer:RootObserver|null=null;private listeners=new Set<DiagnosticListener>();private sessionEpoch=0;
  readonly imports=new Map<string,DocumentFragment>();
  private readonly scopeFactory=new ScopeFactory();private readonly stores=new WeakMap<Scope,StateStore>();private readonly conditionalTemplates=new WeakSet<HTMLTemplateElement>();private readonly listTemplates=new WeakSet<HTMLTemplateElement>();private readonly itemScopes=new WeakMap<Owner,Scope>();private readonly lexicalParents=new WeakMap<Owner,Scope>();readonly planScopes=new WeakMap<Element,Scope>();readonly planOwners=new WeakMap<Element,Owner>();plans:readonly BindingPlan[]=[];
  readonly extensions=new ExtensionRegistry();options:ResolvedOptions|null=null;
  constructor(private readonly initialOptions:unknown={},private readonly moduleNames:()=>readonly string[]=()=>[],readonly services?:RuntimeServices){this.ready=new Promise<void>((resolve,reject)=>{this.resolveReady=resolve;this.rejectReady=reject;});}
  get installedModules():readonly string[]{return Object.freeze([...this.moduleNames()]);}
  get rootElement():Element|null{return this.root;}
  onDiagnostic(listener:DiagnosticListener):()=>void {if(typeof listener!=='function')throw new PlainUIError('REGISTRY_INVALID');if(this.status==='unmounted'||this.status==='unmounting'||this.status==='failed')throw new PlainUIError('OWNER_DISPOSED');this.listeners.add(listener);const release=this.bus?.subscribe(listener);let active=true;return()=>{if(!active)return;active=false;this.listeners.delete(listener);release?.();};}
  mount(root:Element):this {
    if((this.status==='compiling'||this.status==='mounted')&&this.root===root)return this;if(this.status!=='created')throw new PlainUIError('ROOT_ALREADY_MOUNTED');
    if(!(root instanceof Element)||!root.isConnected)throw new PlainUIError('ROOT_INVALID');
    const document=root.ownerDocument;const registrations=registry(document);const raw=root.getAttribute('ui-app')??root.getAttribute('data-ui-app');const name=raw===null?`app-${++registrations.serial}`:raw.trim();
    if(!name||root.hasAttribute('ui-app')&&root.hasAttribute('data-ui-app')||registrations.roots.has(root)||registrations.names.has(name)||root.querySelector('[ui-app],[data-ui-app]')||root.parentElement?.closest('[ui-app],[data-ui-app]')||[...registrations.roots.keys()].some(mounted=>mounted.contains(root)||root.contains(mounted)))throw new PlainUIError('ROOT_INVALID');
    this.status='compiling';this.root=root;this.registry=registrations;this.name=name;registrations.roots.set(root,this);registrations.names.set(name,this);
    try {this.options=resolveConfiguration(root,this.initialOptions);this.bus=new DiagnosticBus(name,this.options.debug);for(const listener of this.listeners)this.bus.subscribe(listener);
      this.tree=new OwnerTree(root,error=>this.diagnose(error));this.scheduler=new Scheduler(error=>this.diagnose(error));this.scope=this.scopeFactory.create('app',this.tree.root);this.state=new StateStore(this.scope);this.stores.set(this.scope,this.state);
      this.extensions.freeze();const compiled=compileTree(root);if(compiled.fatal)throw new PlainUIError('ROOT_INVALID');this.reportIssues(compiled);
      this.plans=compiled.plans;this.compileDeclarations(compiled);this.bindRefs(compiled.plans);this.setupConditionals([root]);this.setupLists([root]);this.bindValues(compiled.plans);this.bindEvents(compiled.plans);this.observe();const imports=this.loadImports(compiled);this.scheduler.afterFlush(this.tree.root,()=>{void imports.then(()=>{if(this.status!=='compiling')return;this.status='mounted';this.resolveReady();});});return this;
    }catch(error){this.status='failed';this.release();this.rejectReady(error);throw error;}
  }
  private reportIssues(result:CompileResult):void {for(const issue of result.issues){const ownerId=this.tree?.ownerOf(issue.element)?.id;this.bus?.emit(issue.code,{directive:issue.name,...(ownerId===undefined?{}:{ownerId})});}}
  private compileDeclarations(result:CompileResult,baseOwner?:Owner,baseScope?:Scope):void {const included=new Set(result.plans.map(plan=>plan.element));for(const plan of result.plans){const element=plan.element;if(element!==this.root&&!this.root!.contains(element))continue;let ancestor=element.parentElement;while(ancestor&&!this.planScopes.has(ancestor))ancestor=ancestor.parentElement;
      const inCurrent=ancestor!==null&&included.has(ancestor);const parentScope=baseScope&&!inCurrent?baseScope:ancestor?this.planScopes.get(ancestor)!:this.scope!;const parentOwner=baseOwner&&!inCurrent?baseOwner:ancestor?this.planOwners.get(ancestor)!:this.tree!.root;const owner=element===this.root?this.tree!.root:this.tree!.create(parentOwner,'element');
      if(element!==this.root)this.tree!.indexNode(owner,element);
      const hasState=plan.phase.declarations.some(item=>item.name==='ui-state');const scope=element===this.root?this.scope!:hasState?this.scopeFactory.create('local',owner,parentScope):parentScope;
      this.planOwners.set(element,owner);this.planScopes.set(element,scope);this.lexicalParents.set(owner,parentScope);
      for(const directive of plan.phase.declarations){if(directive.name==='ui-state'||directive.name==='ui-store'){const target=directive.name==='ui-store'?this.scope!:scope;let value:Record<string,unknown>;try{value=JSON.parse(directive.value) as Record<string,unknown>;}catch{this.bus?.emit('JSON_INVALID',{directive:directive.name});continue;}
        if(directive.name==='ui-store'){target.bindings.set('store',{value:normalizeJson(value),version:0,writable:true,source:'store'});continue;}
        for(const [name,item] of Object.entries(value))try{declareBinding(target,name,'state',item as never);}catch(error){this.diagnose(error);}
      }}
    }}
  private bindValues(plans:readonly BindingPlan[]):void {for(const plan of plans){const owner=this.planOwners.get(plan.element);const scope=this.planScopes.get(plan.element);if(!owner||!scope)continue;const element=plan.element;const store=this.stores.get(scope)??new StateStore(scope);this.stores.set(scope,store);
      const directives=plan.phase.values.filter(item=>item.name==='ui-text'||item.name==='ui-src'||item.name==='ui-href'||item.name==='ui-class'||item.name==='ui-show'||item.name.startsWith('ui-bind-'));
      const clearCloak=()=>{if(element.hasAttribute('ui-cloak')){this.tree!.journal.recordAttribute(element,'ui-cloak');element.removeAttribute('ui-cloak');}if(element.hasAttribute('data-ui-cloak')){this.tree!.journal.recordAttribute(element,'data-ui-cloak');element.removeAttribute('data-ui-cloak');}};
      if(!directives.length){this.scheduler!.enqueue('bindings',{owner,run:clearCloak});continue;}
      let pending=directives.length;const errors=new Set<string>();
      for(const directive of directives){let ast;try{ast=parseExpression(directive.value);}catch{this.bus?.emit('EXPRESSION_PARSE',{directive:directive.name,ownerId:owner.id});errors.add(directive.name);pending--;continue;}
        const classes=directive.name==='ui-class'?new ClassBinding(element):null;
        const observer:StateObserver={owner,dependencies:new Set(),invalidate:()=>this.scheduler?.enqueue('bindings',job)};
        const job={owner,run:()=>{const result=evaluate(ast,lexicalReader(scope),{locale:this.options!.locale,timeZone:this.options!.timeZone,formatters:this.extensions.formatterMap()});
          if(!result.ok){this.bus?.emit(result.code,{directive:directive.name,ownerId:owner.id});errors.add(directive.name);pending=Math.max(0,pending-1);return;}
          try{if(directive.name==='ui-text')setText(element,result.value);else if(directive.name==='ui-class')classes!.update(result.value);else if(directive.name==='ui-show')setShow(element,result.value);else {const sink=directive.name==='ui-src'?'src':directive.name==='ui-href'?'href':directive.name.slice(8);setAttribute(element,sink,result.value);}
            store.replaceDependencies(observer,result.dependencies.map(path=>({path})));errors.delete(directive.name);if(pending>0)pending--;if(errors.size===0&&pending===0)clearCloak();
          }catch(error){this.diagnose(error);errors.add(directive.name);pending=Math.max(0,pending-1);}
        }};
        this.tree!.registerDisposer(owner,()=>store.untrack(observer));this.scheduler!.enqueue('bindings',job);
      }
    }}
  private bindRefs(plans:readonly BindingPlan[]):void {for(const plan of plans){const owner=this.planOwners.get(plan.element),scope=this.planScopes.get(plan.element);if(!owner||!scope)continue;for(const directive of plan.phase.values.filter(item=>item.name==='ui-ref'))try{this.tree!.registerDisposer(owner,registerRef(scope,directive.value,plan.element));}catch(error){this.diagnose(error);}}}
  private bindEvents(plans:readonly BindingPlan[]):void {for(const plan of plans){const owner=this.planOwners.get(plan.element),scope=this.planScopes.get(plan.element);if(!owner||!scope)continue;const store=this.stores.get(scope)??new StateStore(scope);this.stores.set(scope,store);const trigger=plan.element.getAttribute('ui-trigger')??plan.element.getAttribute('data-ui-trigger')??false;
      for(const directive of plan.phase.events)try{const descriptor=parseEventDirective(directive.name,trigger);const commands=parseCommands(directive.value);const services:CommandServices={reset:()=>this.resetSession(),refresh:name=>this.refreshInScope(scope,name)};attachEventHandler(this.tree!,owner,plan.element,descriptor,commands,(list,snapshot,budget)=>executeCommands(list,snapshot,budget,{owner,scope,store,scheduler:this.scheduler!,host:plan.element,registry:this.extensions,services,locale:this.options!.locale,timeZone:this.options!.timeZone,onError:error=>this.diagnose(error)}),error=>this.diagnose(error));}catch(error){this.diagnose(error);}
    }}
  private setupConditionals(nodes:readonly Element[]):void {const parents=new Set<ParentNode>();for(const node of nodes){parents.add(node.parentNode??node);parents.add(node);for(const descendant of node.querySelectorAll('*'))parents.add(descendant);}
    for(const parent of parents)for(const spec of collectConditionalChains(parent)){if(spec.issue){this.bus?.emit(spec.issue);continue;}const first=spec.branches[0]!.template;if(this.conditionalTemplates.has(first))continue;for(const branch of spec.branches)this.conditionalTemplates.add(branch.template);
      const templateOwner=this.planOwners.get(first);const parentOwner=templateOwner?.parent??this.tree!.root;const scope=this.planScopes.get(first)??this.scope!;const store=this.stores.get(scope)??new StateStore(scope);this.stores.set(scope,store);let reads:string[]=[];let limit=false;
      const chain=new ConditionalChain(this.tree!,parentOwner,spec,expression=>{let ast;try{ast=parseExpression(expression);}catch{return {ok:false,code:'EXPRESSION_TYPE'} as const;}const result=evaluate(ast,lexicalReader(scope),{locale:this.options!.locale,timeZone:this.options!.timeZone,formatters:this.extensions.formatterMap()});reads.push(...result.dependencies);if(!result.ok&&result.code==='EXPRESSION_LIMIT')limit=true;return result.ok?{ok:true,value:result.value} as const:{ok:false,code:result.code==='EXPRESSION_LIMIT'?'EXPRESSION_LIMIT':'EXPRESSION_TYPE'} as const;},(inserted,branchOwner)=>{for(const node of inserted){if(!(node instanceof Element))continue;const compiled=compileTree(node);this.reportIssues(compiled);this.compileDeclarations(compiled,branchOwner,scope);this.bindRefs(compiled.plans);this.setupConditionals([node]);this.setupLists([node]);this.bindValues(compiled.plans);this.bindEvents(compiled.plans);}},error=>this.diagnose(error));
      const observer:StateObserver={owner:chain.owner,dependencies:new Set(),invalidate:()=>this.scheduler?.enqueue('structure',job)};
      const job={owner:chain.owner,run:()=>{reads=[];limit=false;chain.update();if(!limit)store.replaceDependencies(observer,[...new Set(reads)].map(path=>({path})));}};
      this.tree!.registerDisposer(chain.owner,()=>store.untrack(observer));job.run();
    }}
  private setupLists(nodes:readonly Element[]):void {const templates=new Set<HTMLTemplateElement>();for(const node of nodes){if(node instanceof HTMLTemplateElement)templates.add(node);for(const template of node.querySelectorAll('template'))templates.add(template);}
    for(const template of templates){if(this.listTemplates.has(template)||!this.planOwners.has(template))continue;const forSource=template.getAttribute('ui-for')??template.getAttribute('data-ui-for');if(forSource===null)continue;this.listTemplates.add(template);
      const keySource=template.getAttribute('ui-key')??template.getAttribute('data-ui-key');if(keySource===null){this.bus?.emit('LOOP_INVALID',{directive:'ui-key'});continue;}
      let spec;let listAst;let keyAst;try{spec=parseFor(forSource);listAst=parseExpression(spec.expression);keyAst=parseExpression(keySource);}catch{this.bus?.emit('LOOP_INVALID',{directive:'ui-for'});continue;}
      const templateOwner=this.planOwners.get(template)!;const parentOwner=templateOwner.parent??this.tree!.root;const parentScope=this.planScopes.get(template)??this.scope!;const store=this.stores.get(parentScope)??new StateStore(parentScope);this.stores.set(parentScope,store);const itemName=spec.item,indexName=spec.index;let keyReads:string[]=[];
      const list=new KeyedList(this.tree!,parentOwner,template,(item,index)=>{const outer=lexicalReader(parentScope);const result=evaluate(keyAst,{read:name=>name===itemName?{found:true,value:item}:name===indexName?{found:true,value:index}:outer.read(name)},{locale:this.options!.locale,timeZone:this.options!.timeZone,formatters:this.extensions.formatterMap()});if(!result.ok)throw new PlainUIError('LOOP_INVALID');keyReads.push(...result.dependencies.filter(path=>path!==itemName&&path!==indexName&&!path.startsWith(itemName+'.')&&!path.startsWith(itemName+'[')));return result.value;},entry=>{const itemScope=this.scopeFactory.create('loop',entry.owner,parentScope);declareBinding(itemScope,itemName,'alias',entry.item);if(indexName)declareBinding(itemScope,indexName,'alias',entry.index);this.itemScopes.set(entry.owner,itemScope);this.stores.set(itemScope,new StateStore(itemScope));for(const node of entry.nodes){if(!(node instanceof Element))continue;const compiled=compileTree(node);this.reportIssues(compiled);this.compileDeclarations(compiled,entry.owner,itemScope);this.bindRefs(compiled.plans);this.setupConditionals([node]);this.setupLists([node]);this.bindValues(compiled.plans);this.bindEvents(compiled.plans);}},entry=>{const itemScope=this.itemScopes.get(entry.owner);if(!itemScope)return;const itemStore=this.stores.get(itemScope)!;itemStore.publish(itemName,entry.item);if(indexName)itemStore.publish(indexName,entry.index);});
      const observer:StateObserver={owner:list.owner,dependencies:new Set(),invalidate:()=>this.scheduler?.enqueue('structure',job)};
      const job={owner:list.owner,run:()=>{keyReads=[];const result=evaluate(listAst,lexicalReader(parentScope),{locale:this.options!.locale,timeZone:this.options!.timeZone,formatters:this.extensions.formatterMap()});if(!result.ok){this.bus?.emit(result.code,{directive:'ui-for',ownerId:list.owner.id});return;}try{list.update(result.value);store.replaceDependencies(observer,[...new Set([...result.dependencies,...keyReads])].map(path=>({path})));}catch(error){this.diagnose(error);}}};
      this.tree!.registerDisposer(list.owner,()=>store.untrack(observer));job.run();
    }}
  private async loadImports(result:CompileResult):Promise<void> {const tasks=result.plans.flatMap(plan=>plan.phase.components.filter(item=>item.name==='ui-import').map(async directive=>{
      const controller=new AbortController();const signal=this.tree!.root.signal;const abort=()=>controller.abort();signal.addEventListener('abort',abort,{once:true});const timer=setTimeout(abort,5000);
      try{const url=new URL(directive.value,plan.element.ownerDocument.baseURI);if(!['http:','https:'].includes(url.protocol)||url.origin!==new URL(plan.element.ownerDocument.baseURI).origin)throw new PlainUIError('COMPONENT_IMPORT');
        const response=await fetch(url.href,{signal:controller.signal});if(!response.ok)throw new PlainUIError('COMPONENT_IMPORT');const markup=await response.text();if(!signal.aborted)this.imports.set(url.href,parseDeveloperImport(markup,plan.element.ownerDocument));
      }catch{if(!signal.aborted)this.bus?.emit('COMPONENT_IMPORT',{directive:'ui-import'});}finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}
    }));await Promise.all(tasks);}
  private nearest(element:Element|null):{owner:Owner;scope:Scope} {while(element){const owner=this.planOwners.get(element),scope=this.planScopes.get(element);if(owner?.active&&scope)return {owner,scope};element=element.parentElement;}return {owner:this.tree!.root,scope:this.scope!};}
  private activateExternal(node:Node):void {if(!(node instanceof Element))return;const base=this.nearest(node.parentElement);const compiled=compileTree(node);this.reportIssues(compiled);this.compileDeclarations(compiled,base.owner,base.scope);this.bindRefs(compiled.plans);this.setupConditionals([node]);this.setupLists([node]);this.bindValues(compiled.plans);this.bindEvents(compiled.plans);}
  private observe():void {this.observer=new RootObserver(this.root!,this.tree!,{
    added:node=>this.activateExternal(node),
    moved:(node,owner)=>{if(!(node instanceof Element))return;const expected=this.lexicalParents.get(owner);if(!expected)return;const destination=this.nearest(node.parentElement);if(destination.scope===expected)return;this.tree!.dispose(owner);this.activateExternal(node);},
    removed:(node,owner)=>{if(node===owner.host||node===owner.range?.start||node===owner.range?.end){if(owner===this.tree!.root)this.tree!.unindexNode(owner,node);else this.tree!.dispose(owner);}else this.tree!.unindexNode(owner,node);},
    directiveChanged:(element,name)=>{const ownerId=this.tree!.ownerOf(element)?.id;this.bus?.emit('DECLARATION_CHANGED',{directive:name,...(ownerId===undefined?{}:{ownerId})});},
  });}
  private diagnose(error:unknown):void {this.bus?.emit(error instanceof PlainUIError?error.code:'COMMAND_ERROR');}
  unmount():void {if(this.status==='unmounted'||this.status==='unmounting')return;if(this.status==='compiling')this.rejectReady(new PlainUIError('OWNER_DISPOSED'));this.status='unmounting';this.release();this.status='unmounted';}
  private release():void {this.observer?.disconnect();this.scheduler?.dispose();this.tree?.dispose(this.tree.root);if(this.root)this.registry?.roots.delete(this.root);if(this.name)this.registry?.names.delete(this.name);this.bus?.clear();this.listeners.clear();}
  private live():void {if(!this.tree?.root.active||this.status==='unmounted'||this.status==='unmounting'||this.status==='failed')throw new PlainUIError('OWNER_DISPOSED');}
  private registration():void {if(this.status!=='created')throw new PlainUIError('REGISTRY_INVALID');}
  registerCommand(name:string,command:Command):this {this.registration();this.extensions.registerCommand(name,command);return this;}
  registerFormatter(name:string,formatter:CustomFormatter):this {this.registration();this.extensions.registerFormatter(name,formatter);return this;}
  registerBehavior(name:string,behavior:BehaviorFactory):this {this.registration();this.extensions.registerBehavior(name,behavior);return this;}
  registerAdapter(name:string,adapter:AdapterDefinition):this {this.registration();this.extensions.registerAdapter(name,adapter);return this;}
  beforeNavigate(guard:(url:string)=>boolean|Promise<boolean>):()=>void {this.live();if(typeof guard!=='function')throw new PlainUIError('REGISTRY_INVALID');if(!this.services?.navigation)throw new PlainUIError('MODULE_MISSING');const unregister=this.services.navigation.beforeNavigate(guard);let active=true;const release=()=>{if(!active)return;active=false;unregister();};this.tree!.registerDisposer(this.tree!.root,release);return release;}
  inspect():InspectorSnapshot {if(!this.options?.debug)throw new PlainUIError('INSPECTOR_DISABLED');return Object.freeze({owners:this.tree?.liveCount??0,timers:0,listeners:0,subscribers:0,pendingActions:0,cacheEntries:0});}
  get(path:string){this.live();return detachedSnapshot(this.state!.read(path));}
  set(path:string,value:unknown):void {this.live();this.state!.write(path,value);}
  batch<T>(callback:()=>T):T {this.live();return this.state!.batch(callback);}
  private refreshInScope(scope:Scope,name:string){this.live();const resource=lookupResource(scope,name);if(!resource)throw new PlainUIError('RESOURCE_UNKNOWN');return resource.refresh();}
  refresh(name:string){this.live();const resource=lookupResource(this.scope!,name,true);if(!resource)return Promise.reject(new PlainUIError('RESOURCE_UNKNOWN'));return resource.refresh();}
  resetSession():void {this.live();this.sessionEpoch++;}
  afterFlush(callback:()=>void):()=>void {if(!this.scheduler||!this.tree)throw new PlainUIError('OWNER_DISPOSED');return this.scheduler.afterFlush(this.tree.root,callback);}
}
