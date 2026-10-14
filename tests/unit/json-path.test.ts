import {expect,test} from 'vitest';
import {normalizeJson,normalizeJsBoundary,parseSafeJson} from '../../packages/core/src/json/normalize.js';
import {detachedSnapshot} from '../../packages/core/src/json/freeze.js';
import {parsePath,readPath,replaceWritablePath} from '../../packages/core/src/state/path.js';

test('json.pollution, json.getter: forbidden keys are rejected without reading accessors',()=>{
  expect(()=>parseSafeJson('{"nested":{"__proto__":1}}')).toThrow('JSON value is invalid.');
  let invoked=0;const source=Object.defineProperty({},'secret',{enumerable:true,get(){invoked++;return 3;}});
  expect(()=>normalizeJson(source)).toThrow('JSON value is invalid.');expect(invoked).toBe(0);
  expect(()=>normalizeJson({constructor:1})).toThrow();
});
test('json.cycle, json.class, json.undefined and repeated references',()=>{
  const self:any={};self.self=self;expect(()=>normalizeJson(self)).toThrow();
  class Example {value=1;}expect(()=>normalizeJson(new Example())).toThrow();
  expect(normalizeJson({value:undefined})).toEqual({value:null});
  const shared={value:1};const result=normalizeJson({left:shared,right:shared}) as any;expect(result.left).toEqual(result.right);expect(result.left).not.toBe(result.right);
  expect(()=>normalizeJson([,])).toThrow();expect(normalizeJsBoundary([,])).toEqual([null]);
});
test('deep JSON input and snapshot freeze are iterative',()=>{
  let value:any=null;for(let i=0;i<20000;i++)value=[value];
  const normalized=normalizeJson(value);const snapshot=detachedSnapshot(normalized);
  expect(Object.isFrozen(snapshot)).toBe(true);let cursor:any=snapshot;for(let i=0;i<20000;i++)cursor=cursor[0];expect(cursor).toBeNull();
});
test('path.sibling-sharing, path.readonly, path.missing-container and snapshots',()=>{
  const original=normalizeJson({user:{name:'A',address:{city:'X'}},other:{n:1}});
  const cell={value:original,writable:true};const changed=replaceWritablePath(cell,parsePath('state.user.name'),'B');
  expect((changed.value as any).user.name).toBe('B');expect((original as any).user.name).toBe('A');expect((changed.value as any).other).toBe((original as any).other);
  expect(changed.changedPrefixes).toEqual(['state','state.user','state.user.name']);
  expect(()=>replaceWritablePath({...cell,writable:false},parsePath('state.user.name'),'C')).toThrow('State is read-only.');
  expect(()=>replaceWritablePath(cell,parsePath('state.missing.leaf'),1)).toThrow('Writable path is invalid.');
  const snapshot=detachedSnapshot(changed.value);expect(Object.isFrozen((snapshot as any).user)).toBe(true);expect(()=>{(snapshot as any).user.name='C';}).toThrow();
});
test('path parser tracks spans and rejects computed or forbidden writes before lookup',()=>{
  const parsed=parsePath("store.items[1]['name']");expect(parsed.segments.map(item=>item.span)).toEqual([{start:5,end:11},{start:11,end:14},{start:14,end:22}]);
  expect(()=>parsePath('store["__proto__"]')).toThrow();expect(()=>parsePath('store.items[index]')).toThrow();expect(()=>parsePath('store.items[-1]')).toThrow();
  expect(()=>parsePath('store.items.length')).toThrow();
  const bindings=new Map([['store',{value:normalizeJson({items:[{name:'A'}]}),writable:true}]]);expect(readPath(bindings,parsePath('store.items[0].name'))).toBe('A');expect(readPath(bindings,parsePath('store.items.length',{writable:false}))).toBe(1);
  expect(()=>replaceWritablePath(bindings.get('store')!,parsePath('store.items[1]'),'B')).toThrow();
});
