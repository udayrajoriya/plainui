import type {App} from '../../core/src/app.js';
import type {ResolvedOptions} from '../../core/src/config.js';
import type {ModuleRuntime} from '../../core/src/integration.js';
import {PlainUIError} from '../../core/src/index.js';
import {DialogController} from './dialog.js';

export class UiRuntime implements ModuleRuntime {
  private dialogs:DialogController|null=null;
  readonly ui={open:(target:Element|undefined)=>{if(!this.dialogs)throw new PlainUIError('OWNER_DISPOSED');this.dialogs.open(target);},close:(target:Element|undefined)=>{if(!this.dialogs)throw new PlainUIError('OWNER_DISPOSED');this.dialogs.close(target);},toast:(_message:string)=>{throw new PlainUIError('MODULE_MISSING');}};
  mount(root:Element,_options:ResolvedOptions):void {this.dialogs=new DialogController(root);}
  unmount():void {this.dialogs?.dispose();this.dialogs=null;}
}
export function installUIRuntime(app:App):void {app.installModuleRuntime(new UiRuntime());}
