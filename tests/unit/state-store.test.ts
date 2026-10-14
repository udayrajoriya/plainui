import {expect,test} from 'vitest';
import {ScopeFactory} from '../../packages/core/src/scope/scope.js';
import {declareBinding} from '../../packages/core/src/scope/declarations.js';
import {StateStore} from '../../packages/core/src/state/store.js';

function fixture(){const owner={active:true,signal:new AbortController().signal};const scope=new ScopeFactory().create('app',owner);declareBinding(scope,'data','state',{left:{value:1},right:{value:2}});return {owner,scope,store:new StateStore(scope)};}
test('state.immediate-read, state.batch-once, and state.async-batch',()=>{
  const {store,scope}=fixture();let calls=0;const observer={dependencies:new Set(),invalidate:()=>calls++};store.track(observer,()=>store.read('data.left.value'));
  store.batch(()=>{store.write('data.left.value',3);expect(store.read('data.left.value')).toBe(3);store.write('data.left.value',4);expect(calls).toBe(0);});
  expect(calls).toBe(1);expect(scope.bindings.get('data')!.version).toBe(2);
  expect(()=>store.batch(()=>{store.write('data.left.value',5);return Promise.resolve();})).toThrow('Batch callback must be synchronous.');expect(store.read('data.left.value')).toBe(5);expect(calls).toBe(2);
});
test('state.parent-child-invalidation, state.sibling-noop, branch dependencies, and failure recovery',()=>{
  const {store}=fixture();let calls=0;const observer={dependencies:new Set(),invalidate:()=>calls++};
  store.track(observer,()=>store.read('data.left.value'));store.write('data.right.value',8);expect(calls).toBe(0);
  store.write('data.left',{value:9});expect(calls).toBe(1);
  expect(()=>store.track(observer,()=>{store.read('data.right.value');throw new Error('fail');})).toThrow();store.write('data.left.value',10);expect(calls).toBe(2);
  store.track(observer,()=>store.read('data.right.value'));store.write('data.left.value',11);expect(calls).toBe(2);store.write('data.right.value',12);expect(calls).toBe(3);
});
test('state.disposed-write and isolated mutable defaults',()=>{
  const {owner,scope,store}=fixture();const input={a:[1]};const declared=declareBinding(scope,'local','state',input);input.a[0]=99;expect(declared.value).toEqual({a:[1]});
  owner.active=false;expect(()=>store.write('data.left.value',2)).toThrow('Owner is disposed.');
});
