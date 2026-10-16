import type { AppScaffold, OfficialModuleBridge, OfficialModuleDefinition } from '../../core/src/module-bridge.js';
import {installRouterRuntime} from './module.js';

export const routerModule: OfficialModuleDefinition = Object.freeze({ name: 'router', bridgeVersion: 1,setup:installRouterRuntime });

export function installRouterWithBridge<T extends AppScaffold>(app: T, bridge: OfficialModuleBridge): T {
  return bridge.install(app, routerModule);
}
