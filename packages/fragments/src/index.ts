import type { AppScaffold, OfficialModuleBridge, OfficialModuleDefinition } from '../../core/src/module-bridge.js';
import {installFragmentsRuntime} from './module.js';

export {FragmentHtmlService,FragmentSanitizer,sanitizeFragment} from './html-service.js';
export type {SanitationReport,SanitizedFragment} from './html-service.js';

export {compileFragmentAction,assertResourceResponseMode,fragmentRequestHeaders,readFragmentResponse} from './action-mode.js';
export type {FragmentActionMode,FragmentSwapMode} from './action-mode.js';
export {resolveFragmentTarget,TargetArbiter} from './target.js';
export type {FragmentTarget} from './target.js';
export {FragmentCandidate,prepareFragmentCandidate} from './candidate.js';
export type {FragmentCandidateOptions} from './candidate.js';
export {commitFragmentSwap} from './swap.js';
export type {CommittedFragmentRange,FragmentSwapHooks,FragmentSwapOptions} from './swap.js';
export {FragmentFocus,assertFragmentBoundary} from './focus.js';
export type {FragmentBoundaryOptions} from './focus.js';
export {FragmentRuntime} from './module.js';

export const fragmentsModule: OfficialModuleDefinition = Object.freeze({ name: 'fragments', bridgeVersion: 1,setup:(app:AppScaffold)=>installFragmentsRuntime(app) });

export function installFragmentsWithBridge<T extends AppScaffold>(app: T, bridge: OfficialModuleBridge): T {
  return bridge.install(app, fragmentsModule);
}
