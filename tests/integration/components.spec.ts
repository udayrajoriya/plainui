import {expect,test} from 'vitest';
import {validateCustomEventName} from '../../packages/components/src/events.js';
import {defaultProp,validateProp} from '../../packages/components/src/props/validate.js';

test('component public value boundaries copy defaults and reject incompatible values',()=>{const rule={type:'object' as const,required:false,default:{quantity:1}};const first=defaultProp(rule) as {quantity:number},second=defaultProp(rule) as {quantity:number};expect(first).toEqual({quantity:1});expect(first).not.toBe(second);expect(()=>validateProp({type:'number',required:true},'1')).toThrowError(/Component prop/);});
test('component event names remain distinct from native and lifecycle events',()=>{expect(validateCustomEventName('quantity-change')).toBe('quantity-change');for(const name of ['click','success','Bad','bad_name'])expect(()=>validateCustomEventName(name)).toThrow();});
