import {PlainUIError} from '../../../core/src/index.js';
import type {CapturedNode} from './capture.js';

export interface SlotAssignment<Scope=unknown> {readonly placeholders:ReadonlyMap<string,HTMLSlotElement>;readonly groups:ReadonlyMap<string,readonly CapturedNode<Scope>[]>}
function meaningful(item:CapturedNode):boolean {return item.node instanceof Element||item.node.nodeType===Node.TEXT_NODE&&Boolean(item.node.textContent?.trim());}
export function assignSlots<Scope>(render:ParentNode,captured:readonly CapturedNode<Scope>[]):SlotAssignment<Scope> {const placeholders=new Map<string,HTMLSlotElement>();for(const slot of render.querySelectorAll('slot')){const name=slot.getAttribute('name')??'';if(placeholders.has(name))throw new PlainUIError('SLOT_INVALID');placeholders.set(name,slot);}const groups=new Map<string,CapturedNode<Scope>[]>();for(const item of captured){const group=groups.get(item.name)??[];group.push(item);groups.set(item.name,group);}for(const [name,group] of groups)if(!placeholders.has(name)&&group.some(meaningful))throw new PlainUIError('SLOT_INVALID');return {placeholders,groups};}
