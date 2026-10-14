/** Records framework mutations until the corresponding observer delivery. */
export class TransactionJournal {
  private expected=new WeakMap<Node,{added:boolean;removed:boolean}>();
  recordAdded(node:Node):void {const entry=this.expected.get(node)??{added:false,removed:false};entry.added=true;this.expected.set(node,entry);}
  recordRemoved(node:Node):void {const entry=this.expected.get(node)??{added:false,removed:false};entry.removed=true;this.expected.set(node,entry);}
  consume(node:Node):{added:boolean;removed:boolean}|undefined {const entry=this.expected.get(node);this.expected.delete(node);return entry;}
}
