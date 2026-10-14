import { expect, test } from 'vitest';
import { DIRECTIVES, resolveDirective, validateAttributeSet, validateDirectiveValue, validateSchema, CONFIG_SCHEMA, validatePropsSchema, validateBehaviorOptions, DIAGNOSTICS } from '../../packages/schema/src/index.js';
import coverage from '../fixtures/schema.json';

test('schema.aliases: every canonical/data spelling resolves to one definition', () => {
  expect(DIRECTIVES).toHaveLength(61);
  expect(coverage.rows).toHaveLength(61);
  for (const row of DIRECTIVES) {
    expect(resolveDirective(row.name)).toBe(row);
    expect(resolveDirective(row.name.replace(/^ui-/,'data-ui-'))).toBe(row);
    const entry = coverage.rows.find(item => item.name === row.name)!;
    for (const spelling of entry.spellings) expect(entry.coverage[spelling]).toEqual({valid:`schema.valid.${spelling}`,invalid:`schema.invalid.${spelling}`,lifecycle:`lifecycle.${spelling}`});
  }
});
test('schema.collisions: canonical/data duplicates and sink conflicts fail', () => {
  expect(validateAttributeSet({'ui-cloak':'','data-ui-cloak':''})).toContainEqual({code:'DIRECTIVE_CONFLICT',name:'ui-cloak'});
  expect(validateAttributeSet({'ui-src':'x','ui-bind-src':'x'})).toContainEqual({code:'DIRECTIVE_CONFLICT',name:'ui-src'});
  expect(validateAttributeSet({'ui-show':'x','ui-bind-hidden':'x'})).toContainEqual({code:'DIRECTIVE_CONFLICT',name:'ui-show'});
  expect(validateAttributeSet({'ui-model':'field','ui-bind-value':'x'})).toContainEqual({code:'DIRECTIVE_CONFLICT',name:'ui-model'});
});
test('presence, integer, enum, identifier and family syntax are exact', () => {
  expect(validateDirectiveValue(resolveDirective('ui-cloak')!,'')).toBe(true);
  expect(validateDirectiveValue(resolveDirective('ui-cloak')!,'true')).toBe(false);
  for (const value of ['-1','+1','1.0','1e1','9007199254740992']) expect(validateDirectiveValue(resolveDirective('ui-timeout')!,value)).toBe(false);
  expect(validateDirectiveValue(resolveDirective('ui-retry')!,'3')).toBe(true);
  expect(validateDirectiveValue(resolveDirective('ui-retry')!,'4')).toBe(false);
  expect(validateDirectiveValue(resolveDirective('ui-load')!,'Auto')).toBe(false);
  expect(validateDirectiveValue(resolveDirective('ui-derived')!,'_x$1')).toBe(true);
  expect(resolveDirective('ui-bind-onclick')).toBeUndefined();
  expect(resolveDirective('ui-bind-style')).toBeUndefined();
  expect(resolveDirective('ui-on:click.prevent.once')?.name).toBe('ui-on:*');
  expect(resolveDirective('ui-on:success.prevent')).toBeUndefined();
});
test('cross-attribute rules reject invalid request and structure combinations', () => {
  expect(validateAttributeSet({'ui-post':'/x','ui-get':'/x'}).map(x => x.code)).toContain('DIRECTIVE_CONFLICT');
  expect(validateAttributeSet({'ui-get':'/x','ui-body':'x'}).map(x => x.name)).toContain('ui-body');
  expect(validateAttributeSet({'ui-for':'item of rows'},{tagName:'template'}).map(x => x.name)).toContain('ui-for');
  expect(validateAttributeSet({'ui-text':'x'},{hasOwnedChildren:true}).map(x => x.name)).toContain('ui-text');
  expect(validateAttributeSet({'ui-data':'x','ui-get':'/x'},{tagName:'div'}).map(x => x.name)).toContain('ui-data');
});
test('configuration and prop schemas reject nested unknown fields', () => {
  expect(validateSchema({api:{bad:true}},CONFIG_SCHEMA)).toContainEqual({path:'$.api.bad',reason:'unknown'});
  expect(validateSchema({api:{timeoutMs:0}},CONFIG_SCHEMA)).toContainEqual({path:'$.api.timeoutMs',reason:'range'});
  expect(validatePropsSchema({name:{type:'string',required:true,default:'x'}}).map(x => x.path)).toContain('$.name.default');
  expect(validateBehaviorOptions('tabs',{orientation:'diagonal'}).map(x => x.path)).toContain('$.orientation');
  expect(validateBehaviorOptions('tabs',{surprise:1}).map(x => x.path)).toContain('$.surprise');
});
test('all diagnostic messages are static and redaction safe', () => {
  expect(Object.keys(DIAGNOSTICS).length).toBeGreaterThan(50);
  for (const [code,[severity,message]] of Object.entries(DIAGNOSTICS)) {
    expect(code).toMatch(/^[A-Z_]+$/);
    expect(['error','warning']).toContain(severity);
    expect(message).not.toMatch(/[{}]/);
  }
});
