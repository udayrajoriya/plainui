import type {Owner,OwnerTree} from '../ownership/owner.js';

export interface ObserverHooks {added(node:Node):void;moved(node:Node,owner:Owner):void;removed(node:Node,owner:Owner):void;directiveChanged(element:Element,name:string):void}
export class RootObserver {
  private readonly observer:MutationObserver;private active=true;
  constructor(private readonly root:Element,private readonly tree:OwnerTree,private readonly hooks:ObserverHooks){const view=root.ownerDocument.defaultView;if(!view)throw new Error('Document has no browsing context');this.observer=new view.MutationObserver(records=>this.deliver(records));this.observer.observe(root,{childList:true,subtree:true,attributes:true});}
  private ignored(node:Node):boolean {const element=node instanceof Element?node.parentElement:node.parentElement;return Boolean(element?.closest('[ui-ignore],[data-ui-ignore]'));}
  private deliver(records:MutationRecord[]):void {if(!this.active)return;const added=new Set<Node>();const removed=new Set<Node>();
    for(const record of records){if(record.type==='attributes'){if(record.target instanceof Element&&record.attributeName&&(record.attributeName.startsWith('ui-')||record.attributeName.startsWith('data-ui-'))&&!this.tree.journal.consumeAttribute(record.target,record.attributeName)&&!this.ignored(record.target))this.hooks.directiveChanged(record.target,record.attributeName);continue;}
      for(const node of record.addedNodes)if(!this.tree.journal.consume(node,'added'))added.add(node);
      for(const node of record.removedNodes)if(!this.tree.journal.consume(node,'removed'))removed.add(node);
    }
    for(const node of removed){const owner=this.tree.ownerOf(node);if(!owner||this.root.contains(node))continue;this.hooks.removed(node,owner);}
    for(const node of added){if(!this.root.contains(node)||this.ignored(node))continue;const owner=this.tree.ownerOf(node);if(owner?.active){if(owner!==this.tree.root)this.hooks.moved(node,owner);continue;}this.hooks.added(node);}
  }
  disconnect():void {if(!this.active)return;this.active=false;this.observer.disconnect();}
}
