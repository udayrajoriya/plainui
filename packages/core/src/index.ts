export { SCHEMA_FORMAT_VERSION } from '../../schema/src/index.js';
export { resolveConfiguration } from './config.js';
export { DiagnosticBus } from './diagnostics/emit.js';
export { Inspector } from './diagnostics/inspector.js';
export { PlainUIError } from './diagnostics/codes.js';
export { createScaffoldApp, getModuleBridge, MODULE_BRIDGE_VERSION } from './module-bridge.js';
export type { ActionService, DomService, RequestService, RuntimeServices } from './integration.js';
export type { AppScaffold, OfficialModuleBridge, OfficialModuleDefinition, OfficialModuleName } from './module-bridge.js';
