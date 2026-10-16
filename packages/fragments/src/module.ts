import type {App} from '../../core/src/app.js';
import type {ResolvedOptions} from '../../core/src/config.js';
import type {ModuleRuntime} from '../../core/src/integration.js';
import {TargetArbiter} from './target.js';

export class FragmentRuntime implements ModuleRuntime {
  readonly targets=new TargetArbiter();root:Element|null=null;options:ResolvedOptions|null=null;
  mount(root:Element,options:ResolvedOptions):void {this.root=root;this.options=options;}
  unmount():void {this.root=null;this.options=null;}
}
export function installFragmentsRuntime(app:App):void {app.installModuleRuntime(new FragmentRuntime());}
