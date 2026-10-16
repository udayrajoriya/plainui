import {PlainUIError} from '../../../core/src/index.js';
import {ComponentRegistry} from '../registry.js';
import {resolveImport,cyclePath} from './resolve.js';
import {loadImport} from './load.js';
import {parseImport} from './parse.js';

export class ImportCycleError extends PlainUIError {readonly location:string;constructor(urls:readonly string[]){super('COMPONENT_IMPORT_CYCLE');this.location=cyclePath(urls);}}
export class ComponentImportGraph {
  private readonly loaded=new Map<string,Promise<void>>();
  private readonly failed=new Set<string>();
  constructor(private readonly document:Document,private readonly registry:ComponentRegistry,private readonly timeoutMs:number,private readonly signal:AbortSignal,private readonly diagnose:(error:unknown)=>void,private readonly record?:(url:string,fragment:DocumentFragment)=>void){}
  async load(sources:readonly string[]):Promise<void> {const origin=new URL(this.document.baseURI).origin;for(const source of sources){if(this.signal.aborted)return;try{await this.visit(source,this.document.baseURI,origin,[]);}catch(error){if(!this.signal.aborted)this.diagnose(error);}}}
  private visit(source:string,base:string,origin:string,trail:readonly string[]):Promise<void> {const url=resolveImport(source,base,origin),key=url.href;if(trail.includes(key))return Promise.reject(new ImportCycleError([...trail,key]));if(this.failed.has(key))return Promise.resolve();const existing=this.loaded.get(key);if(existing)return existing;const promise=(async()=>{try{const markup=await loadImport(url,this.timeoutMs,this.signal);if(this.signal.aborted)return;const parsed=parseImport(markup,this.document);for(const child of parsed.imports)await this.visit(child,key,origin,[...trail,key]);if(this.signal.aborted)return;for(const definition of parsed.definitions)this.registry.register(definition);this.record?.(key,parsed.fragment);}catch(error){this.failed.add(key);throw error;}})();this.loaded.set(key,promise);return promise;}
  dispose():void {this.loaded.clear();this.failed.clear();}
}
