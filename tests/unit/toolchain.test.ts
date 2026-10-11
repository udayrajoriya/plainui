import { expect, test } from 'vitest';
import { smokeGreeting } from '../toolchain/smoke.js';

test('TypeScript source runs in Vitest', () => {
  expect(smokeGreeting('unit')).toBe('PlainUI toolchain ready: unit');
});
