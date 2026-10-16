import {expect,test} from 'vitest';
import {compilePattern,comparePatterns} from '../../packages/router/src/pattern.js';
import {validateCustomEventName} from '../../packages/components/src/events.js';

test('composition contracts retain deterministic route specificity and component events',()=>{const patterns=[compilePattern('/products/:id'),compilePattern('/products/new')].sort(comparePatterns);expect(patterns.map(item=>item.path)).toEqual(['/products/new','/products/:id']);expect(validateCustomEventName('quantity-change')).toBe('quantity-change');});
