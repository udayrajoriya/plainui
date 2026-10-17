import type { RuntimeServices } from './integration.js';
import {App} from './app.js';
import {PlainUIError} from './diagnostics/codes.js';
import {parseExpression} from './expression/parse.js';
import {evaluate} from './expression/evaluate.js';

export {PlainUIError,parseExpression,evaluate};
export type {ResolvedOptions} from './config.js';
export type {ModuleRuntime,FragmentActionService} from './integration.js';
export type {RouteRecord} from './public-api/types.js';
export type {BehaviorFactory,ReadonlyJson} from './public-api/types.js';

declare const __PLAINUI_DEBUG__: boolean;

export const MODULE_BRIDGE_VERSION = 1 as const;
export type OfficialModuleName = 'router' | 'fragments' | 'ui';

export interface OfficialModuleDefinition {
  readonly name: OfficialModuleName;
  readonly bridgeVersion: typeof MODULE_BRIDGE_VERSION;
  readonly setup?:(app:AppScaffold)=>void;
}

export type AppScaffold=App;

interface AppRecord {
  readonly modules: Map<OfficialModuleName, OfficialModuleDefinition>;
  readonly services: RuntimeServices;
}

const apps = new WeakMap<AppScaffold, AppRecord>();
const classicModules = new Map<OfficialModuleName, OfficialModuleDefinition>();

function validateDefinition(definition: OfficialModuleDefinition): void {
  if (typeof __PLAINUI_DEBUG__ !== 'undefined' && __PLAINUI_DEBUG__ && !Object.isFrozen(definition)) {
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
  readonly PlainUIError:typeof PlainUIError;
  readonly parseExpression:typeof parseExpression;
  readonly evaluate:typeof evaluate;
  install<T extends AppScaffold>(app: T, definition: OfficialModuleDefinition): T;
  registerClassic(definition: OfficialModuleDefinition): void;
}

export const officialModuleBridge: OfficialModuleBridge = Object.freeze({
  version: MODULE_BRIDGE_VERSION,
  PlainUIError,
  parseExpression,
  evaluate,
  install<T extends AppScaffold>(app: T, definition: OfficialModuleDefinition): T {
    const record = apps.get(app);
    if (!record) throw new Error('PlainUI module installation requires an App from this runtime');
    if(app.status!=='created')throw new Error('PlainUI modules must be installed before mount');
    addModule(record.modules, definition);
    definition.setup?.(app);
    return app;
  },
  registerClassic(definition: OfficialModuleDefinition): void {
    addModule(classicModules, definition);
  },
});

export function createScaffoldApp(services: RuntimeServices,options:unknown={}): AppScaffold {
  const record: AppRecord = {
    modules: new Map(classicModules),
    services,
  };
  const app=new App(options,()=>[...record.modules.keys()],services);
  apps.set(app, record);
  for(const definition of record.modules.values())definition.setup?.(app);
  return app;
}

export function getModuleBridge(): OfficialModuleBridge {
  return officialModuleBridge;
}
