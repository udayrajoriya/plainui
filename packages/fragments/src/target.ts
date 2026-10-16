import {PlainUIError} from '../../core/src/index.js';

export interface FragmentTarget {readonly element:Element;readonly owner:object;readonly generation:number;readonly signal:AbortSignal}
interface Generation {value:number;controller:AbortController|null}

function fail():never {throw new PlainUIError('FRAGMENT_POLICY');}

export function resolveFragmentTarget(input:{readonly root:Element;readonly action:Element;readonly ref:string;readonly lookup:(name:string)=>Element|undefined;readonly ownerOf?:(element:Element)=>object|undefined;readonly prohibited?:(element:Element)=>boolean}):{element:Element;owner:object} {
  const element=input.lookup(input.ref);if(!element||!element.isConnected||element.ownerDocument!==input.root.ownerDocument||element!==input.root&&!input.root.contains(element))fail();
  const ignored=element.closest('[ui-ignore],[data-ui-ignore]');if(ignored&&input.root.contains(ignored))fail();
  if(input.prohibited?.(element))fail();
  const owner=input.ownerOf?.(element)??element;return Object.freeze({element,owner});
}

export class TargetArbiter {
  private readonly generations=new WeakMap<object,Generation>();
  begin(target:{readonly element:Element;readonly owner:object},lifetime?:AbortSignal):FragmentTarget {if(!target.element.isConnected||lifetime?.aborted)fail();let state=this.generations.get(target.owner);if(!state){state={value:0,controller:null};this.generations.set(target.owner,state);}state.controller?.abort();const controller=new AbortController(),generation=++state.value;state.controller=controller;if(lifetime){const abort=()=>controller.abort();lifetime.addEventListener('abort',abort,{once:true});controller.signal.addEventListener('abort',()=>lifetime.removeEventListener('abort',abort),{once:true});}return Object.freeze({element:target.element,owner:target.owner,generation,signal:controller.signal});}
  isCurrent(target:FragmentTarget):boolean {const state=this.generations.get(target.owner);return Boolean(state&&state.value===target.generation&&state.controller?.signal===target.signal&&!target.signal.aborted&&target.element.isConnected);}
  release(target:FragmentTarget):void {const state=this.generations.get(target.owner);if(state?.value===target.generation&&state.controller?.signal===target.signal){state.controller.abort();state.controller=null;}}
}
