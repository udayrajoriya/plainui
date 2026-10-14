import type { RuntimeServices } from './integration.js';

declare const __PLAINUI_DEBUG__: boolean;
const DEBUG = typeof __PLAINUI_DEBUG__ !== 'undefined' && __PLAINUI_DEBUG__;

export const MODULE_BRIDGE_VERSION = 1 as const;
export type OfficialModuleName = 'router' | 'fragments' | 'ui';

export interface OfficialModuleDefinition {
  readonly name: OfficialModuleName;
  readonly bridgeVersion: typeof MODULE_BRIDGE_VERSION;
}

/** T003 scaffold. T017 replaces mount with the complete lifecycle. */
export interface AppScaffold {
  readonly installedModules: readonly OfficialModuleName[];
  mount(root: Element): never;
}

interface AppRecord {
  readonly modules: Map<OfficialModuleName, OfficialModuleDefinition>;
  readonly services: RuntimeServices;
}

const apps = new WeakMap<AppScaffold, AppRecord>();
const classicModules = new Map<OfficialModuleName, OfficialModuleDefinition>();

function validateDefinition(definition: OfficialModuleDefinition): void {
  if (DEBUG && !Object.isFrozen(definition)) {
    throw new Error(`PlainUI debug assertion: module definition is mutable: ${definition.name}`);
  }
  if (definition.bridgeVersion !== MODULE_BRIDGE_VERSION) {
    throw new Error(`PlainUI module bridge version mismatch: ${definition.name}`);
  }
  if (definition.name !== 'router' && definition.name !== 'fragments' && definition.name !== 'ui') {
    throw new Error('Unknown PlainUI official module');
  }
}

function addModule(
  modules: Map<OfficialModuleName, OfficialModuleDefinition>,
  definition: OfficialModuleDefinition,
): void {
  validateDefinition(definition);
  const existing = modules.get(definition.name);
  if (existing && existing !== definition) {
    throw new Error(`PlainUI module already registered: ${definition.name}`);
  }
  modules.set(definition.name, definition);
}

export interface OfficialModuleBridge {
  readonly version: typeof MODULE_BRIDGE_VERSION;
  install<T extends AppScaffold>(app: T, definition: OfficialModuleDefinition): T;
  registerClassic(definition: OfficialModuleDefinition): void;
}

export const officialModuleBridge: OfficialModuleBridge = Object.freeze({
  version: MODULE_BRIDGE_VERSION,
  install<T extends AppScaffold>(app: T, definition: OfficialModuleDefinition): T {
    const record = apps.get(app);
    if (!record) throw new Error('PlainUI module installation requires an App from this runtime');
    addModule(record.modules, definition);
    return app;
  },
  registerClassic(definition: OfficialModuleDefinition): void {
    addModule(classicModules, definition);
  },
});

export function createScaffoldApp(services: RuntimeServices): AppScaffold {
  const record: AppRecord = {
    modules: new Map(classicModules),
    services,
  };
  const app: AppScaffold = Object.freeze({
    get installedModules(): readonly OfficialModuleName[] {
      return Object.freeze([...record.modules.keys()]);
    },
    mount(_root: Element): never {
      throw new Error('PlainUI mount is scheduled for T017');
    },
  });
  apps.set(app, record);
  return app;
}

export function getModuleBridge(): OfficialModuleBridge {
  return officialModuleBridge;
}
