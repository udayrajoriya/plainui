import {PlainUIError} from '@plainui/runtime-bridge';
import type {FragmentCandidate} from './candidate.js';
import type {FragmentSwapMode} from './action-mode.js';
import type {FragmentTarget,TargetArbiter} from './target.js';

export interface CommittedFragmentRange {readonly start:Comment;readonly end:Comment;release():void}
export interface FragmentSwapHooks {
  readonly transaction?:(mutate:()=>void)=>void;readonly disposeChildren?:(target:Element)=>void;readonly disposeTarget?:(target:Element)=>void;readonly attach?:(nodes:readonly Node[],mode:FragmentSwapMode)=>void;readonly activate?:(nodes:readonly Node[],mode:FragmentSwapMode)=>void;readonly registerOuterRef?:(name:string,element:Element)=>void;readonly invalidate?:()=>void;readonly diagnose?:(error:PlainUIError)=>void;
}
export interface FragmentSwapOptions {readonly target:FragmentTarget;readonly arbiter:TargetArbiter;readonly candidate:FragmentCandidate;readonly mode:FragmentSwapMode;readonly actionActive:()=>boolean;readonly targetActive:()=>boolean;readonly expectedEpoch:number;readonly getEpoch:()=>number;readonly prohibited?:(target:Element,mode:FragmentSwapMode)=>boolean;readonly hooks?:FragmentSwapHooks}
const sequence=new WeakMap<Element,{prependBefore:Node|null;afterBefore:Node|null}>();
function fail(candidate:FragmentCandidate):never {candidate.release();throw new PlainUIError('FRAGMENT_POLICY');}
function nodesBetween(start:Comment,end:Comment):Node[]{const nodes:Node[]=[];for(let node=start.nextSibling;node&&node!==end;node=node.nextSibling)nodes.push(node);return nodes;}
function range(start:Comment,end:Comment,signals:readonly AbortSignal[]):CommittedFragmentRange {let active=true;const release=()=>{if(!active)return;active=false;let node:Node|null=start;while(node){const next:Node|null=node.nextSibling;node.parentNode?.removeChild(node);if(node===end)break;node=next;}for(const signal of signals)signal.removeEventListener('abort',release);};for(const signal of signals){if(signal.aborted)release();else signal.addEventListener('abort',release,{once:true});}return Object.freeze({start,end,release});}
function safeFailure(document:Document):HTMLElement {const failure=document.createElement('p');failure.setAttribute('role','alert');failure.textContent='Content could not be displayed.';return failure;}

export function commitFragmentSwap(options:FragmentSwapOptions):CommittedFragmentRange|null {
  const {target,candidate,mode,hooks={}}=options,destination=target.element;
  if(!options.actionActive()||!options.targetActive()||options.getEpoch()!==options.expectedEpoch||!options.arbiter.isCurrent(target)||!destination.isConnected||options.prohibited?.(destination,mode))fail(candidate);
  const parent=destination.parentNode,next=destination.nextSibling;if((mode==='outer'||mode==='before'||mode==='after')&&!parent)fail(candidate);
  const fragment=candidate.take(),inserted=[...fragment.childNodes],ranges:CommittedFragmentRange[]=[];const recoveryParent:Node|null=parent,recoveryBefore:Node|null=next;
  try {
    const mutate=()=>{switch(mode){case 'inner':hooks.disposeChildren?.(destination);destination.replaceChildren(fragment);break;case 'outer':hooks.disposeTarget?.(destination);destination.replaceWith(fragment);if(candidate.transferredRef&&candidate.replacement)hooks.registerOuterRef?.(candidate.transferredRef,candidate.replacement);break;case 'append':case 'prepend':case 'before':case 'after':{const state=sequence.get(destination)??{prependBefore:destination.firstChild,afterBefore:destination.nextSibling};sequence.set(destination,state);const start=destination.ownerDocument.createComment('plainui-fragment:start'),end=destination.ownerDocument.createComment('plainui-fragment:end'),wrapped=destination.ownerDocument.createDocumentFragment();wrapped.append(start,fragment,end);if(mode==='append')destination.append(wrapped);else if(mode==='prepend')destination.insertBefore(wrapped,state.prependBefore?.parentNode===destination?state.prependBefore:null);else if(mode==='before')parent!.insertBefore(wrapped,destination);else parent!.insertBefore(wrapped,state.afterBefore?.parentNode===parent?state.afterBefore:null);ranges.push(range(start,end,target.lifetime?[target.lifetime]:[]));break;}}};
    hooks.transaction?hooks.transaction(mutate):mutate();hooks.attach?.(inserted,mode);hooks.activate?.(inserted,mode);hooks.invalidate?.();options.arbiter.release(target);return ranges[0]??null;
  } catch {
    for(const committed of ranges)committed.release();const failure=safeFailure(destination.ownerDocument);if(mode==='inner'&&destination.isConnected)destination.replaceChildren(failure);else if(mode==='outer'&&recoveryParent)recoveryParent.insertBefore(failure,recoveryBefore?.parentNode===recoveryParent?recoveryBefore:null);else if(destination.isConnected)destination.append(failure);const error=new PlainUIError('FRAGMENT_ACTIVATION');hooks.diagnose?.(error);options.arbiter.release(target);throw error;
  }
}
