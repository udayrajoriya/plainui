import { PlainUI } from './index.js';

const host = globalThis as typeof globalThis & { PlainUI?: typeof PlainUI };
if (host.PlainUI) throw new Error('PlainUI core is already loaded');
host.PlainUI = PlainUI;
