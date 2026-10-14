import { getModuleBridge } from '@plainui/runtime-bridge';
import type { AppScaffold } from '../../core/src/module-bridge.js';
import { installRouterWithBridge } from './index.js';

export function installRouter<T extends AppScaffold>(app: T): T {
  return installRouterWithBridge(app, getModuleBridge());
}
