import {expect,test} from 'vitest';
import {assertFragmentBoundary} from '../../packages/fragments/src/focus.js';

function element(contains:Element[]=[]):Element{return {contains:(candidate:Element)=>contains.includes(candidate)} as unknown as Element;}
test('fragment ownership rejects router ranges and owner-based action ancestors',()=>{const action=element(),target=element([action]),root=element([target]);expect(()=>assertFragmentBoundary({root,target,action,mode:'inner',routerOwned:value=>value===target})).toThrow();expect(()=>assertFragmentBoundary({root,target,action,mode:'outer'})).toThrow();});
test('fragment ownership permits declared component local regions',()=>{const target=element(),action=element(),root=element([target]);expect(()=>assertFragmentBoundary({root,target,action,mode:'inner',componentRegion:()=> 'local'})).not.toThrow();expect(()=>assertFragmentBoundary({root,target,action,mode:'inner',componentRegion:()=> 'internal'})).toThrow();});
