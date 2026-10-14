import {expect,test} from 'vitest';
import fc from 'fast-check';
import {parseCached,parseCacheSize,parseExpression} from '../../packages/core/src/expression/parse.js';
import {PRECEDENCE} from '../../packages/core/src/expression/precedence.js';
import {ExpressionError} from '../../packages/core/src/expression/tokens.js';
import {tokenize} from '../../packages/core/src/expression/tokenize.js';

test('parse.precedence: exhaustive binary operator-pair matrix',()=>{
  const operators=Object.keys(PRECEDENCE);
  for(const first of operators)for(const second of operators){
    const source=`a ${first} b ${second} c`;
    const mix=(first==='??'&&['&&','||'].includes(second))||(second==='??'&&['&&','||'].includes(first));
    if(mix){expect(()=>parseExpression(source)).toThrow(ExpressionError);continue;}
    const ast=parseExpression(source);expect(ast.kind).toBe('binary');if(ast.kind==='binary')expect(ast.operator).toBe(PRECEDENCE[first]!<PRECEDENCE[second]!?first:second);
  }
  const ternary=parseExpression('a ? b : c ? d : e');expect(ternary.kind).toBe('ternary');if(ternary.kind==='ternary')expect(ternary.no.kind).toBe('ternary');
});
test('parse.nullish-mix and parentheses',()=>{
  for(const source of ['a ?? b || c','a && b ?? c','a ?? b && c','a || b ?? c'])expect(()=>parseExpression(source)).toThrow();
  expect(parseExpression('(a ?? b) || c').kind).toBe('binary');expect(parseExpression('a ?? (b && c)').kind).toBe('binary');
});
test('parse.unicode-bytes, parse.depth-128-129 and member-chain depth',()=>{
  expect(()=>tokenize(`'${'😀'.repeat(4096)}'`)).toThrow('Expression limit exceeded.');
  expect(parseExpression(`${'-'.repeat(127)}1`).depth).toBe(128);
  expect(()=>parseExpression(`${'-'.repeat(128)}1`)).toThrow('Expression limit exceeded.');
  expect(parseExpression(`x${'.a'.repeat(127)}`).depth).toBe(128);
  expect(()=>parseExpression(`x${'.a'.repeat(128)}`)).toThrow('Expression limit exceeded.');
  expect(()=>parseExpression(`${'('.repeat(300)}x${')'.repeat(300)}`)).toThrow('Expression limit exceeded.');
});
test('parse.strings, objects, calls, spans and trailing tokens',()=>{
  const source=`{"a":'line\\n',"b":len(items[0])}`;const ast=parseExpression(source);expect(ast.kind).toBe('object');expect(ast.span).toEqual({start:0,end:source.length});
  expect(()=>parseExpression('{"a":1,"a":2}')).toThrow();expect(()=>parseExpression('[1,]')).toThrow();expect(()=>parseExpression('f(1,)')).toThrow();
  expect(()=>parseExpression('"bad\\x"')).toThrow();expect(()=>parseExpression("'raw\nline'")).toThrow();
  expect(tokenize("'\\u0061'")[0]?.value).toBe('a');
});
test('parse.no-executable-syntax and forbidden keys',()=>{
  for(const source of ['a=1','a==b','new Foo()','function(){}','x=>x','`hi`','/x/','obj.method()','foo++','0x10','a.__proto__','a["constructor"] = 1'])expect(()=>parseExpression(source),source).toThrow();
  expect(()=>parseExpression('{"prototype":1}')).toThrow();
});
test('parse cache is version/mode keyed, bounded, and freezes ASTs',()=>{
  const ast=parseCached('value+1');expect(parseCached('value+1')).toBe(ast);expect(Object.isFrozen(ast)).toBe(true);
  for(let i=0;i<600;i++)parseCached(`x+${i}`);expect(parseCacheSize()).toBeLessThanOrEqual(512);
  expect(()=>parseCached('bad(')).toThrow(ExpressionError);expect(()=>parseCached('bad(')).toThrow(ExpressionError);
});
test('fast-check arbitrary text terminates with AST or bounded diagnostic',()=>{
  fc.assert(fc.property(fc.string({maxLength:300}),source=>{try{parseExpression(source);return true;}catch(error){return error instanceof ExpressionError;}}),{numRuns:2000,seed:20261014});
});
