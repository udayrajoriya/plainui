import {PlainUIError} from '../diagnostics/codes.js';
import type {Owner,OwnerTree} from './owner.js';
export type DomRange={start:Comment;end:Comment;owner:Owner};
export function createRange(tree:OwnerTree,owner:Owner,document:Document):DomRange {tree.assertActive(owner);if(owner.range)throw new PlainUIError('OWNER_RANGE');const range={start:document.createComment(`plainui:${owner.id}:start`),end:document.createComment(`plainui:${owner.id}:end`),owner};owner.range=range;tree.indexNode(owner,range.start);tree.indexNode(owner,range.end);return range;}
export function assertRange(range:DomRange):Node[] {const parent=range.start.parentNode;if(!parent||parent!==range.end.parentNode)throw new PlainUIError('OWNER_RANGE');const nodes:Node[]=[];let current:Node|null=range.start;while(current){nodes.push(current);if(current===range.end)return nodes;current=current.nextSibling;}throw new PlainUIError('OWNER_RANGE');}
function assertDestination(tree:OwnerTree,parent:Node):void {if(!(parent===tree.element||tree.element.contains(parent)))throw new PlainUIError('OWNER_RANGE');if(parent instanceof Element&&parent.closest('[ui-ignore],[data-ui-ignore]'))throw new PlainUIError('OWNER_RANGE');}
export function insertRange(tree:OwnerTree,range:DomRange,parent:Node,before:Node|null,content:DocumentFragment):void {
  tree.assertActive(range.owner);assertDestination(tree,parent);if(range.start.parentNode||range.end.parentNode)throw new PlainUIError('OWNER_RANGE');
  if(before&&before.parentNode!==parent)throw new PlainUIError('OWNER_RANGE');
  const fragment=parent.ownerDocument!.createDocumentFragment();fragment.append(range.start,content,range.end);tree.indexNode(range.owner,fragment);for(const node of fragment.childNodes)tree.journal.recordAdded(node);parent.insertBefore(fragment,before);
}
export function moveRange(tree:OwnerTree,range:DomRange,parent:Node,before:Node|null):void {
  tree.assertActive(range.owner);assertDestination(tree,parent);const nodes=assertRange(range);
  if(before&&before.parentNode!==parent)throw new PlainUIError('OWNER_RANGE');
  if(before&&nodes.includes(before))return;
  const focused=parent.ownerDocument!.activeElement;
  const restoreFocus=focused&&nodes.some(node=>node===focused||node.contains(focused));
  const fragment=parent.ownerDocument!.createDocumentFragment();for(const node of nodes){tree.journal.recordRemoved(node);tree.journal.recordAdded(node);fragment.append(node);}parent.insertBefore(fragment,before);
  if(restoreFocus&&focused instanceof HTMLElement&&focused.isConnected)focused.focus({preventScroll:true});
}
