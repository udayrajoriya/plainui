import type {AppScaffold,ResolvedOptions,ModuleRuntime,FragmentActionService} from '@plainui/runtime-bridge';
import {TargetArbiter,resolveFragmentTarget} from './target.js';
import {prepareFragmentCandidate} from './candidate.js';
import {commitFragmentSwap} from './swap.js';
import {compileFragmentAction} from './action-mode.js';

export class FragmentRuntime implements ModuleRuntime {
  readonly targets=new TargetArbiter();root:Element|null=null;options:ResolvedOptions|null=null;
  readonly fragments:FragmentActionService={handle:input=>{if(!this.root||this.root!==input.root||!this.options)throw new Error('Fragment runtime is not mounted.');const mode=compileFragmentAction({'ui-response':'html','ui-target':input.targetRef,'ui-swap':input.swap,'ui-enhance':String(input.enhance)},this.options.fragments.enhance),resolved=resolveFragmentTarget({root:input.root,action:input.action,ref:mode.targetRef,lookup:input.lookup}),target=this.targets.begin(resolved,input.signal),candidate=prepareFragmentCandidate({document:input.root.ownerDocument,root:input.root,destination:resolved.element,markup:input.markup,mode:mode.swap,enhanced:mode.enhance,targetRef:mode.targetRef});commitFragmentSwap({target,arbiter:this.targets,candidate,mode:mode.swap,actionActive:()=>input.actionOwner.active,targetActive:()=>resolved.element.isConnected,expectedEpoch:input.expectedEpoch,getEpoch:input.getEpoch});return null;}};
  mount(root:Element,options:ResolvedOptions):void {this.root=root;this.options=options;}
  unmount():void {this.root=null;this.options=null;}
}
export function installFragmentsRuntime(app:AppScaffold):void {app.installModuleRuntime(new FragmentRuntime());}
