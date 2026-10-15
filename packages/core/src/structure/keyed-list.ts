import {PlainUIError} from '../diagnostics/codes.js';
import type {JsonValue} from '../json/normalize.js';
import {assertRange,createRange,insertRange,moveRange,type DomRange} from '../ownership/range.js';
import type {Owner,OwnerTree} from '../ownership/owner.js';

type Key=string|number;
type Entry={key:Key;item:JsonValue;index:number;owner:Owner;range:DomRange;nodes:Node[]};
export class KeyedList {
  readonly owner:Owner;readonly range:DomRange;private entries=new Map<Key,Entry>();
  constructor(private readonly tree:OwnerTree,parentOwner:Owner,private readonly template:HTMLTemplateElement,private readonly keyOf:(item:JsonValue,index:number)=>JsonValue,private readonly activate:(entry:{owner:Owner;nodes:readonly Node[];item:JsonValue;index:number})=>void,private readonly retained:(entry:{owner:Owner;item:JsonValue;index:number})=>void){
    if(!template.hasAttribute('ui-key')&&!template.hasAttribute('data-ui-key'))throw new PlainUIError('LOOP_INVALID');const parent=template.parentNode;if(!parent)throw new PlainUIError('OWNER_RANGE');this.owner=tree.create(parentOwner,'loop');this.range=createRange(tree,this.owner,template.ownerDocument);insertRange(tree,this.range,parent,template,template.ownerDocument.createDocumentFragment());
  }
  update(value:JsonValue):void {if(!this.owner.active)return;const items=value===null?[]:value;if(!Array.isArray(items))throw new PlainUIError('LOOP_INVALID');
    const keys:Key[]=[];const seen=new Set<Key>();for(let index=0;index<items.length;index++){const candidate=this.keyOf(items[index]!,index);if(typeof candidate!=='string'&&!(typeof candidate==='number'&&Number.isFinite(candidate)))throw new PlainUIError('LOOP_INVALID');const key=Object.is(candidate,-0)?0:candidate;if(seen.has(key))throw new PlainUIError('DUPLICATE_KEY');seen.add(key);keys.push(key);}
    const prepared=new Map<Key,{entry:Entry;fragment:DocumentFragment}>();try{for(let index=0;index<items.length;index++){const key=keys[index]!;if(this.entries.has(key))continue;const fragment=this.template.content.cloneNode(true) as DocumentFragment;const nodes=[...fragment.childNodes];const owner=this.tree.create(this.owner,'loop-item');const range=createRange(this.tree,owner,this.template.ownerDocument);prepared.set(key,{entry:{key,item:items[index]!,index,owner,range,nodes},fragment});}}catch(error){for(const {entry} of prepared.values())this.tree.dispose(entry.owner);throw error;}
    const focused=this.template.ownerDocument.activeElement;const hadFocus=focused&&assertRange(this.range).some(node=>node===focused||node.contains(focused));for(const [key,entry] of this.entries)if(!seen.has(key))this.tree.dispose(entry.owner);
    const parent=this.range.start.parentNode!;let before:Node=this.range.end;const next=new Map<Key,Entry>();for(let index=items.length-1;index>=0;index--){const key=keys[index]!;let entry=this.entries.get(key);if(entry&&entry.owner.active){entry.item=items[index]!;entry.index=index;this.retained({owner:entry.owner,item:entry.item,index});moveRange(this.tree,entry.range,parent,before);}else{const created=prepared.get(key)!;entry=created.entry;insertRange(this.tree,entry.range,parent,before,created.fragment);this.activate({owner:entry.owner,nodes:entry.nodes,item:entry.item,index});}before=entry.range.start;next.set(key,entry);}
    this.entries=new Map(keys.map(key=>[key,next.get(key)!]));
    const active=this.template.ownerDocument.activeElement;const document=this.template.ownerDocument;
    if(hadFocus&&focused&&!focused.isConnected&&(!active||active===document.body||active===document.documentElement)){const container=parent instanceof Element?parent:this.template.parentElement;if(container){const had=container.hasAttribute('tabindex');if(!had)container.setAttribute('tabindex','-1');(container as HTMLElement).focus({preventScroll:true});if(!had)container.addEventListener('blur',()=>container.removeAttribute('tabindex'),{once:true});}}
  }
  get keys():readonly Key[]{return [...this.entries.keys()];}
}
