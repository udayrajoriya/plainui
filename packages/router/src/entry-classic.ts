import type { OfficialModuleBridge } from '../../core/src/module-bridge.js';
import { routerModule } from './index.js';

const host = globalThis as typeof globalThis & {
  PlainUI?: { __moduleBridge_v1?: OfficialModuleBridge };
};
const bridge = host.PlainUI?.__moduleBridge_v1;
if (!bridge) throw new Error('PlainUI core must load before plainui-router.js');
bridge.registerClassic(routerModule);
