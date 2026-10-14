import type { AppScaffold, OfficialModuleBridge, OfficialModuleDefinition } from '../../core/src/module-bridge.js';

export const routerModule: OfficialModuleDefinition = Object.freeze({ name: 'router', bridgeVersion: 1 });

export function installRouterWithBridge<T extends AppScaffold>(app: T, bridge: OfficialModuleBridge): T {
  return bridge.install(app, routerModule);
}
