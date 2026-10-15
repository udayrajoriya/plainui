/** Records framework mutations until the corresponding observer delivery. */
export class TransactionJournal {
  private expected=new WeakMap<Node,{added:number;removed:number}>();
  private attributes=new WeakMap<Element,Map<string,number>>();
  recordAdded(node:Node):void {const entry=this.expected.get(node)??{added:0,removed:0};entry.added++;this.expected.set(node,entry);}
  recordRemoved(node:Node):void {const entry=this.expected.get(node)??{added:0,removed:0};entry.removed++;this.expected.set(node,entry);}
  consume(node:Node,kind:'added'|'removed'):boolean {const entry=this.expected.get(node);if(!entry||entry[kind]===0)return false;entry[kind]--;if(entry.added===0&&entry.removed===0)this.expected.delete(node);return true;}
  recordAttribute(element:Element,name:string):void {const entries=this.attributes.get(element)??new Map<string,number>();entries.set(name,(entries.get(name)??0)+1);this.attributes.set(element,entries);}
  consumeAttribute(element:Element,name:string):boolean {const entries=this.attributes.get(element);const count=entries?.get(name)??0;if(!count)return false;if(count===1)entries!.delete(name);else entries!.set(name,count-1);return true;}
}
