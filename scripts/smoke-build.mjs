import { build } from 'esbuild';

const entryPoints = ['tests/toolchain/smoke.ts'];
const shared = { entryPoints, bundle: true, target: 'es2022', sourcemap: true, logLevel: 'info' };

await build({ ...shared, format: 'iife', globalName: 'PlainUIToolchainSmoke', outfile: 'dist/smoke/classic.js' });
await build({ ...shared, format: 'esm', outfile: 'dist/smoke/esm.mjs' });
