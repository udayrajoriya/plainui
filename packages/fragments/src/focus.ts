import {PlainUIError} from '../../core/src/index.js';
import type {FragmentSwapMode} from './action-mode.js';

export class FragmentFocus {
  private readonly active:Element|null;private disposed=false;private cleanup:(()=>void)|null=null;
  constructor(private readonly document:Document,private readonly permitted:(element:Element)=>boolean=()=>true){this.active=document.activeElement;}
  restore(fallback:Element,afterFlush:(callback:()=>void)=>void,live:()=>boolean=()=>true):void {
    if(this.disposed)return;if(this.active?.isConnected&&this.permitted(this.active))return;
    afterFlush(()=>{if(this.disposed||!live()||!fallback.isConnected)return;const element=fallback as HTMLElement;if(typeof element.focus!=='function')return;const hadTabIndex=element.hasAttribute('tabindex'),previous=element.getAttribute('tabindex');if(element.tabIndex<0&&!hadTabIndex)element.setAttribute('tabindex','-1');element.focus();let active=true;const cleanup=()=>{if(!active)return;active=false;element.removeEventListener('blur',cleanup);if(!hadTabIndex)element.removeAttribute('tabindex');else if(previous!==null)element.setAttribute('tabindex',previous);if(this.cleanup===cleanup)this.cleanup=null;};element.addEventListener('blur',cleanup,{once:true});this.cleanup=cleanup;});
  }
  dispose():void {if(this.disposed)return;this.disposed=true;this.cleanup?.();this.cleanup=null;}
}

export interface FragmentBoundaryOptions {
  readonly root:Element;readonly target:Element;readonly action:Element;readonly mode:FragmentSwapMode;readonly routerOwned?:(element:Element)=>boolean;readonly componentRegion?:(element:Element)=>'host'|'internal'|'local'|null;readonly targetOwner?:object;readonly actionOwner?:object;readonly ownerContains?:(ancestor:object,descendant:object)=>boolean;
}
export function assertFragmentBoundary(options:FragmentBoundaryOptions):void {
  const {root,target,action,mode}=options;if(target===root||!root.contains(target)||options.routerOwned?.(target))throw new PlainUIError('FRAGMENT_POLICY');
  const component=options.componentRegion?.(target)??null;if(component==='internal'||component==='host'&&mode==='outer')throw new PlainUIError('FRAGMENT_POLICY');
  if(mode==='outer'&&(target===action||target.contains(action)||Boolean(options.targetOwner&&options.actionOwner&&options.ownerContains?.(options.targetOwner,options.actionOwner))))throw new PlainUIError('FRAGMENT_POLICY');
}
