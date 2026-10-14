import {expect,test} from 'vitest';
import {parseExpression} from '../../packages/core/src/expression/parse.js';
import {evaluate,EvaluationBudget,FormatterGuard} from '../../packages/core/src/expression/evaluate.js';
import {IntlCache} from '../../packages/core/src/expression/intl-cache.js';
import {normalizeJson} from '../../packages/core/src/json/normalize.js';

const options={locale:'en-US',timeZone:'UTC'};
function run(source:string,values:Record<string,unknown>={},extra:Record<string,unknown>={}){
  const bindings=normalizeJson(values) as Record<string,any>;
  return evaluate(parseExpression(source),{read:name=>({found:Object.hasOwn(bindings,name),value:bindings[name]??null})},{...options,...extra});
}
test('eval.null-missing tracks exact reads without failing on null chaining',()=>{
  const result=run('user.profile.name ?? "Loading"',{user:{profile:null}});
  expect(result).toMatchObject({ok:true,value:'Loading',missing:true,dependencies:['user.profile.name']});
  expect(run('absent')).toMatchObject({ok:false,code:'IDENTIFIER_UNKNOWN'});
  expect(run('text.length',{text:'abc'})).toMatchObject({ok:true,value:null,missing:true});
});
test('eval.identity, truthiness and own properties',()=>{
  expect(run('a === a',{a:[1]})).toMatchObject({ok:true,value:true});
  expect(run('a === b',{a:[1],b:[1]})).toMatchObject({ok:true,value:false});
  expect(run('[] || 5')).toMatchObject({ok:true,value:[]});
  expect(run('0 || 5')).toMatchObject({ok:true,value:5});
  expect(run('object["__proto__"]',{object:{}})).toMatchObject({ok:false,code:'EXPRESSION_TYPE'});
});
test('eval.no-coercion and zero division fail out of band',()=>{
  for(const source of ['1 + "2"','"2" < 3','1 / 0','1 % 0','1e308 * 10','!false + 1'])expect(run(source),source).toMatchObject({ok:false,code:'EXPRESSION_TYPE',value:null});
  expect(run('"a" + "b"')).toMatchObject({ok:true,value:'ab'});
});
test('eval.short-circuit skips unknown names and preserves selected operands',()=>{
  expect(run('false && unknown')).toMatchObject({ok:true,value:false});
  expect(run('true || unknown')).toMatchObject({ok:true,value:true});
  expect(run('1 ?? unknown')).toMatchObject({ok:true,value:1});
  expect(run('false ? unknown : 4')).toMatchObject({ok:true,value:4});
  expect(run('null ?? 4')).toMatchObject({ok:true,value:4});
});
test('eval.step-limit stops before operation 10001 and shares invocation budget',()=>{
  const budget=new EvaluationBudget(3);
  expect(run('1+2',{}, {budget})).toMatchObject({ok:true,value:3,steps:3});
  expect(run('1',{}, {budget})).toMatchObject({ok:false,code:'EXPRESSION_LIMIT',steps:3});
  const long=`[${Array.from({length:10001},()=>1).join(',')}]`;
  expect(()=>parseExpression(long)).toThrow('Expression limit exceeded.');
  const withinSourceLimit=`[${Array.from({length:5000},()=>'!1').join(',')}]`;
  expect(evaluate(parseExpression(withinSourceLimit),{read:()=>({found:false,value:null})},options)).toMatchObject({ok:false,code:'EXPRESSION_LIMIT',steps:10000});
});
test('format.leap-day and format.date-zone',()=>{
  expect(run('date("2024-02-29")',{}, {timeZone:'America/Los_Angeles'})).toMatchObject({ok:true,value:'2/29/2024'});
  expect(run('date("2024-02-30")')).toMatchObject({ok:false,code:'EXPRESSION_TYPE'});
  expect(run('date("2024-01-01T00:00:00Z")',{}, {timeZone:'America/Los_Angeles'})).toMatchObject({ok:true,value:'12/31/2023'});
  expect(run('date("2024-01-01T00:00:00")')).toMatchObject({ok:false,code:'EXPRESSION_TYPE'});
});
test('format.bad-currency, len, json and bounded Intl cache',()=>{
  expect(run('currency(1,"US")')).toMatchObject({ok:false,code:'EXPRESSION_TYPE'});
  expect(run('len("😀")')).toMatchObject({ok:true,value:2});
  expect(run('len({"a":1,"b":2})')).toMatchObject({ok:true,value:2});
  expect(run('json([1,null])')).toMatchObject({ok:true,value:'[1,null]'});
  const cache=new IntlCache();for(let i=0;i<200;i++)cache.getNumber('en-US',`X${String.fromCharCode(65+Math.floor(i/26))}${String.fromCharCode(65+i%26)}`);expect(cache.size).toBeLessThanOrEqual(128);
});
test('format.async-rejected and formatter state writes are rejected',()=>{
  const guard=new FormatterGuard();
  const formatters=new Map<string,(...args:any[])=>unknown>([['async',()=>Promise.resolve(1)],['write',()=>{guard.assertWritable();return 1;}],['safe',value=>({value})]]);
  expect(run('async()',{}, {formatters,guard})).toMatchObject({ok:false,code:'EXPRESSION_TYPE'});
  expect(run('write()',{}, {formatters,guard})).toMatchObject({ok:false,code:'EXPRESSION_TYPE'});
  expect(run('safe(2)',{}, {formatters,guard})).toMatchObject({ok:true,value:{value:2}});
});
