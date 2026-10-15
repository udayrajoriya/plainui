import {expect,test} from 'vitest';
import fc from 'fast-check';
import {parseCommands} from '../../packages/core/src/commands/parse.js';
import {parseExpression} from '../../packages/core/src/expression/parse.js';
import {resolveDirective,validateDirectiveValue} from '../../packages/schema/src/directives.js';

test('foundation parsers process 10,000 deterministic generated strings without escaping typed failure',()=>{
  let checked=0;
  fc.assert(fc.property(fc.string({maxLength:64}),source=>{
    checked++;
    for(const parse of [parseExpression,parseCommands])try{parse(source);}catch(error){expect(error).toBeInstanceOf(Error);}
  }),{seed:20261015,numRuns:10000});
  expect(checked).toBe(10000);
});
test('every core directive has a valid and invalid value case',()=>{
  const cases:[string,string,string][]= [
    ['ui-app','one',''],['ui-config','config',''],['ui-state','{}','[]'],['ui-store','{}','[]'],
    ['ui-derived','double','bad-name'],['ui-value','count * 2',''],['ui-persist','local','memory'],['ui-persist-key','counter',''],
    ['ui-cloak','','yes'],['ui-ref','field','bad-name'],['ui-ignore','','yes'],['ui-text','count',''],
    ['ui-bind-title','count',''],['ui-src','image',''],['ui-href','link',''],['ui-class','classes',''],['ui-show','show',''],
    ['ui-if','show',''],['ui-else-if','other',''],['ui-else','','yes'],['ui-for','item in items',''],['ui-key','item.id',''],
    ['ui-on:click','emit("changed")',''],
  ];
  for(const [name,valid,invalid] of cases){const directive=resolveDirective(name);expect(directive,name).toBeDefined();expect(validateDirectiveValue(directive!,valid),`${name} valid`).toBe(true);expect(validateDirectiveValue(directive!,invalid),`${name} invalid`).toBe(false);}
  expect(cases).toHaveLength(23);
});
