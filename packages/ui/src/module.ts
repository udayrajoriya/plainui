import {PlainUIError,type AppScaffold,type ResolvedOptions,type ModuleRuntime} from '@plainui/runtime-bridge';
import {DialogController} from './dialog.js';

export class UiRuntime implements ModuleRuntime {
  private dialogs:DialogController|null=null;
  readonly ui={open:(target:Element|undefined)=>{if(!this.dialogs)throw new PlainUIError('OWNER_DISPOSED');this.dialogs.open(target);},close:(target:Element|undefined)=>{if(!this.dialogs)throw new PlainUIError('OWNER_DISPOSED');this.dialogs.close(target);},toast:(_message:string)=>{throw new PlainUIError('MODULE_MISSING');}};
  mount(root:Element,_options:ResolvedOptions):void {this.dialogs=new DialogController(root);}
  unmount():void {this.dialogs?.dispose();this.dialogs=null;}
}
export function installUIRuntime(app:AppScaffold):void {app.installModuleRuntime(new UiRuntime());}
