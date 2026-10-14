import { getModuleBridge } from '@plainui/runtime-bridge';
import type { AppScaffold } from '../../core/src/module-bridge.js';
import { installUIWithBridge } from './index.js';

export function installUI<T extends AppScaffold>(app: T): T {
  return installUIWithBridge(app, getModuleBridge());
}
