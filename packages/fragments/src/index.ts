import type { AppScaffold, OfficialModuleBridge, OfficialModuleDefinition } from '../../core/src/module-bridge.js';

export const fragmentsModule: OfficialModuleDefinition = Object.freeze({ name: 'fragments', bridgeVersion: 1 });

export function installFragmentsWithBridge<T extends AppScaffold>(app: T, bridge: OfficialModuleBridge): T {
  return bridge.install(app, fragmentsModule);
}
