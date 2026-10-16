import {defineConfig} from 'vitest/config';
import {resolve} from 'node:path';

export default defineConfig({resolve:{alias:{'@plainui/runtime-bridge':resolve(import.meta.dirname,'packages/core/src/module-bridge.ts')}}});
