import {PlainUIError} from '../diagnostics/codes.js';
import {TransactionJournal} from './transaction.js';
export type OwnerRange={start:Comment;end:Comment;owner:Owner};
export type OwnerKind='root'|'element'|'state'|'conditional'|'loop'|'loop-item'|'component'|'slot'|'route'|'fragment'|'behavior';
export interface Owner {readonly id:number;readonly kind:OwnerKind;readonly parent:Owner|null;active:boolean;readonly children:Set<Owner>;readonly controller:AbortController;readonly signal:AbortSignal;readonly disposers:Array<()=>void>;range?:OwnerRange;host?:Node;readonly nodes:Set<Node>;readonly lifetimeDependents:Set<Owner>}
export class OwnerTree {
  private nextId=1;private all=new Set<Owner>();
  readonly journal=new TransactionJournal();
  readonly root:Owner;
  constructor(readonly element:Element,private readonly onCleanupError?:(error:unknown)=>void){this.root=this.create(null,'root');this.indexNode(this.root,element);}
  create(parent:Owner|null,kind:OwnerKind):Owner {
    if(parent&&!parent.active)throw new PlainUIError('OWNER_DISPOSED');
    const controller=new AbortController();const owner:Owner={id:this.nextId++,kind,parent,active:true,children:new Set(),controller,signal:controller.signal,disposers:[],nodes:new Set(),lifetimeDependents:new Set()};
    parent?.children.add(owner);this.all.add(owner);return owner;
  }
  indexNode(owner:Owner,node:Node):void {this.assertActive(owner);if(!owner.host&&node instanceof Element)owner.host=node;this.indexSubtree(owner,node);}
  unindexNode(owner:Owner,node:Node):void {if(this.nodeOwners.get(node)===owner){this.nodeOwners.delete(node);owner.nodes.delete(node);}for(const child of node.childNodes)this.unindexNode(owner,child);}
  private indexSubtree(owner:Owner,node:Node):void {this.nodeOwners.set(node,owner);owner.nodes.add(node);for(const child of node.childNodes)this.indexSubtree(owner,child);}
  readonly nodeOwners=new WeakMap<Node,Owner>();
  ownerOf(node:Node):Owner|undefined{return this.nodeOwners.get(node);}
  assertActive(owner:Owner):void {if(!owner.active)throw new PlainUIError('OWNER_DISPOSED');}
  registerDisposer(owner:Owner,callback:()=>void):()=>void {
    this.assertActive(owner);let active=true;const once=()=>{if(active){active=false;callback();}};owner.disposers.push(once);return once;
  }
  ownListener(owner:Owner,target:EventTarget,type:string,listener:EventListenerOrEventListenerObject):void {this.assertActive(owner);target.addEventListener(type,listener,{signal:owner.controller.signal});this.registerDisposer(owner,()=>target.removeEventListener(type,listener));}
  ownTimeout(owner:Owner,callback:()=>void,delay:number):void {this.assertActive(owner);const id=setTimeout(()=>{if(owner.active)callback();},delay);this.registerDisposer(owner,()=>clearTimeout(id));}
  linkLifetime(dependent:Owner,host:Owner):void {
    this.assertActive(dependent);this.assertActive(host);
    if(dependent===host||this.reaches(dependent,host))throw new PlainUIError('OWNER_RANGE');
    host.lifetimeDependents.add(dependent);this.registerDisposer(dependent,()=>host.lifetimeDependents.delete(dependent));
  }
  private reaches(start:Owner,target:Owner):boolean {const seen=new Set<Owner>();const stack=[start];while(stack.length){const item=stack.pop()!;if(item===target)return true;if(seen.has(item))continue;seen.add(item);stack.push(...item.children,...item.lifetimeDependents);}return false;}
  dispose(owner:Owner):void {
    if(!owner.active)return;
    const collected:Owner[]=[];const seen=new Set<Owner>();const gather=(item:Owner):void=>{if(seen.has(item))return;seen.add(item);collected.push(item);for(const child of item.children)gather(child);for(const dependent of item.lifetimeDependents)gather(dependent);};gather(owner);
    for(const item of collected)item.active=false;
    for(const item of collected)try{item.controller.abort();}catch(error){this.onCleanupError?.(error);}
    const cleaned=new Set<Owner>();const cleanup=(item:Owner):void=>{
      if(cleaned.has(item))return;cleaned.add(item);
      for(const child of [...item.children])if(seen.has(child))cleanup(child);
      for(const dependent of [...item.lifetimeDependents])if(seen.has(dependent)&&dependent.parent!==item)cleanup(dependent);
      for(let i=item.disposers.length-1;i>=0;i--)try{item.disposers[i]!();}catch(error){this.onCleanupError?.(error);}
      item.disposers.length=0;
      if(item.range){try{const {start,end}=item.range;if(!start.parentNode||start.parentNode!==end.parentNode)throw new PlainUIError('OWNER_RANGE');let node:Node|null=start;const nodes:Node[]=[];while(node){nodes.push(node);if(node===end)break;node=node.nextSibling;}if(node!==end)throw new PlainUIError('OWNER_RANGE');for(const owned of nodes){this.journal.recordRemoved(owned);owned.parentNode?.removeChild(owned);}}catch(error){this.onCleanupError?.(error);item.range.start.remove();item.range.end.remove();}}
      for(const node of item.nodes)this.nodeOwners.delete(node);item.nodes.clear();item.parent?.children.delete(item);this.all.delete(item);item.lifetimeDependents.clear();
    };cleanup(owner);
  }
  get liveCount():number{return this.all.size;}
  owns(owner:{readonly active:boolean}):boolean{return this.all.has(owner as Owner);}
  snapshot():{readonly byKind:Readonly<Record<OwnerKind,number>>;readonly ranges:number;readonly rangeConsumers:number} {const byKind=Object.fromEntries(['root','element','state','conditional','loop','loop-item','component','slot','route','fragment','behavior'].map(kind=>[kind,0])) as Record<OwnerKind,number>;let ranges=0,rangeConsumers=0;for(const owner of this.all){if(!owner.active)continue;byKind[owner.kind]++;if(owner.range){ranges++;rangeConsumers+=owner.lifetimeDependents.size;}}return {byKind,ranges,rangeConsumers};}
}
