import type { AppScaffold, OfficialModuleBridge, OfficialModuleDefinition } from '../../core/src/module-bridge.js';

export const uiModule: OfficialModuleDefinition = Object.freeze({ name: 'ui', bridgeVersion: 1 });

export function installUIWithBridge<T extends AppScaffold>(app: T, bridge: OfficialModuleBridge): T {
  return bridge.install(app, uiModule);
}
