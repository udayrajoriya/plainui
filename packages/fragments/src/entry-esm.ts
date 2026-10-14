import { getModuleBridge } from '@plainui/runtime-bridge';
import type { AppScaffold } from '../../core/src/module-bridge.js';
import { installFragmentsWithBridge } from './index.js';

export function installFragments<T extends AppScaffold>(app: T): T {
  return installFragmentsWithBridge(app, getModuleBridge());
}
