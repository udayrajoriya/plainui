import {expect,test} from 'vitest';
import {compileAction} from '../../packages/data/src/action/compile.js';
import {IDLE_ACTION} from '../../packages/data/src/action/record.js';
import {initialActionContext} from '../../packages/data/src/action/context.js';

const input=(tagName:string,directives:Record<string,string>,fragmentsInstalled=false)=>({tagName,directives,fragmentsInstalled});
test('action.default-trigger selects submit, change, and click',()=>{expect(compileAction({...input('form',{'ui-post':'/save','ui-encoding':'json'}),nativeForm:{action:'/save',method:'post'}}).trigger).toBe('submit');expect(compileAction(input('select',{'ui-get':'/choices'})).trigger).toBe('change');expect(compileAction(input('button',{'ui-post':'/save'})).trigger).toBe('click');});
test('action.method-conflict and duplicate trigger handler fail statically',()=>{expect(()=>compileAction(input('button',{'ui-post':'/save','ui-get':'/save'}))).toThrow();expect(()=>compileAction(input('button',{'ui-post':'/save','ui-on:click':'save()'}))).toThrow();});
test('action.body-get and missing fragment module fail',()=>{expect(()=>compileAction(input('button',{'ui-get':'/items','ui-body':'value'}))).toThrow();expect(()=>compileAction(input('button',{'ui-get':'/html','ui-response':'html','ui-target':'#panel','ui-swap':'inner'}))).toThrow();expect(()=>compileAction(input('button',{'ui-post':'/save','ui-target':'#panel'}))).toThrow();});
test('action.invalid-native-fallback requires explicit matching form fallback',()=>{expect(()=>compileAction({...input('form',{'ui-post':'/save'}),nativeForm:{action:null,method:'post'}})).toThrow();expect(()=>compileAction({...input('form',{'ui-post':'/save'}),nativeForm:{action:'/save',method:'get'}})).toThrow();expect(compileAction({...input('form',{'ui-post':'/save'}),nativeForm:{action:'/save',method:'post'}}).method).toBe('POST');});
test('action.unnamed-context starts with an isolated idle record',()=>{expect(IDLE_ACTION).toEqual({pending:false,status:'idle',data:null,error:null});expect(initialActionContext()).toMatchObject({record:IDLE_ACTION,generation:0,active:true});});
