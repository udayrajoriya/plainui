import type {AppScaffold,ResolvedOptions,ModuleRuntime} from '@plainui/runtime-bridge';
import {TargetArbiter} from './target.js';

export class FragmentRuntime implements ModuleRuntime {
  readonly targets=new TargetArbiter();root:Element|null=null;options:ResolvedOptions|null=null;
  mount(root:Element,options:ResolvedOptions):void {this.root=root;this.options=options;}
  unmount():void {this.root=null;this.options=null;}
}
export function installFragmentsRuntime(app:AppScaffold):void {app.installModuleRuntime(new FragmentRuntime());}
