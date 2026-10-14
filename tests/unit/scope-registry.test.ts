import {expect,test} from 'vitest';
import {ScopeFactory} from '../../packages/core/src/scope/scope.js';
import {declareBinding,installContext} from '../../packages/core/src/scope/declarations.js';
import {lookupBinding,lookupAppBinding,lookupResource,registerResource,lexicalReader} from '../../packages/core/src/scope/lookup.js';
import {registerRef,lookupRef} from '../../packages/core/src/scope/refs.js';
import {ExtensionRegistry} from '../../packages/core/src/registry.js';

const owner=()=>({active:true,signal:new AbortController().signal});
test('scope.shadow and scope.component-isolation',()=>{
  const factory=new ScopeFactory();const app=factory.create('app',owner());const caller=factory.create('local',owner(),app);const child=factory.create('local',owner(),caller);const component=factory.component(owner(),app);
  declareBinding(app,'count','state',1);declareBinding(caller,'count','state',2);
  expect(lookupBinding(child,'count')?.value).toBe(2);expect(lookupAppBinding(child,'count')?.value).toBe(1);expect(lookupBinding(component,'count')?.value).toBe(1);
  declareBinding(caller,'secret','state',5);expect(lookupBinding(component,'secret')).toBeUndefined();expect(lexicalReader(child).read('count')).toEqual({found:true,value:2});
});
test('scope.duplicate-cross-kind and scope.reserved',()=>{
  const scope=new ScopeFactory().create('app',owner());declareBinding(scope,'record','state',null);
  expect(()=>declareBinding(scope,'record','resource',null)).toThrow('Declaration name is duplicated.');
  for(const name of ['store','route','props','$event','$action','$result','$error','__proto__'])expect(()=>declareBinding(scope,name,'state',null)).toThrow();
  const props=installContext(scope,'props',{name:'A'});expect(props.writable).toBe(false);
});
test('scope.ref-shadow and separate reference namespace',()=>{
  const factory=new ScopeFactory();const app=factory.create('app',owner());const child=factory.create('local',owner(),app);const first={id:'first'} as unknown as Element;const second={id:'second'} as unknown as Element;
  const release=registerRef(app,'target',first);registerRef(child,'target',second);
  expect(lookupRef(child,'target')).toBe(second);expect(()=>registerRef(child,'target',first)).toThrow();
  declareBinding(child,'target','state',null);expect(lookupBinding(child,'target')).toBeDefined();release();release();expect(lookupRef(app,'target')).toBeUndefined();
});
test('scope.app-only resource resolution excludes local declarations',()=>{
  const factory=new ScopeFactory();const app=factory.create('app',owner());const local=factory.create('local',owner(),app);const appResource={refresh:async()=>1};const localResource={refresh:async()=>2};
  registerResource(app,'global',appResource);registerResource(local,'nearby',localResource);
  expect(lookupResource(local,'nearby')).toBe(localResource);expect(lookupResource(local,'nearby',true)).toBeUndefined();expect(lookupResource(local,'global',true)).toBe(appResource);
  expect(()=>declareBinding(local,'nearby','state',3)).toThrow();
});
test('registry.after-mount and registry.builtin',()=>{
  const registry=new ExtensionRegistry();registry.registerCommand('custom',()=>1).registerFormatter('formatX',value=>value).registerAdapter('api',{version:'v2'});
  expect(registry.getAdapter('identity')?.version).toBe('1');expect(registry.getAdapter('api')?.version).toBe('v2');
  expect(()=>registry.registerFormatter('len',()=>1)).toThrow();expect(()=>registry.registerCommand('custom',()=>2)).toThrow();
  registry.freeze();expect(()=>registry.registerCommand('later',()=>1)).toThrow();expect(registry.isFrozen).toBe(true);
});
