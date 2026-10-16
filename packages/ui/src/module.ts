import {PlainUIError,type AppScaffold,type ResolvedOptions,type ModuleRuntime} from '@plainui/runtime-bridge';
import {DialogController} from './dialog.js';
import {ToastController} from './toast.js';

export class UiRuntime implements ModuleRuntime {
  private dialogs:DialogController|null=null;private toasts:ToastController|null=null;
  readonly ui={open:(target:Element|undefined)=>{if(!this.dialogs)throw new PlainUIError('OWNER_DISPOSED');this.dialogs.open(target);},close:(target:Element|undefined)=>{if(!this.dialogs)throw new PlainUIError('OWNER_DISPOSED');this.dialogs.close(target);},toast:(message:unknown)=>{if(!this.toasts)throw new PlainUIError('OWNER_DISPOSED');this.toasts.toast(message);}};
  mount(root:Element,_options:ResolvedOptions):void {this.dialogs=new DialogController(root);this.toasts=new ToastController(root);}
  unmount():void {this.toasts?.dispose();this.toasts=null;this.dialogs?.dispose();this.dialogs=null;}
}
export function installUIRuntime(app:AppScaffold):void {app.installModuleRuntime(new UiRuntime());}
