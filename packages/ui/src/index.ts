import type { AppScaffold, OfficialModuleBridge, OfficialModuleDefinition } from '../../core/src/module-bridge.js';
import {installUIRuntime} from './module.js';

export {DialogController} from './dialog.js';
export {ToastController} from './toast.js';
export {UiRuntime} from './module.js';

export const uiModule: OfficialModuleDefinition = Object.freeze({ name: 'ui', bridgeVersion: 1,setup:(app:AppScaffold)=>installUIRuntime(app) });

export function installUIWithBridge<T extends AppScaffold>(app: T, bridge: OfficialModuleBridge): T {
  return bridge.install(app, uiModule);
}
