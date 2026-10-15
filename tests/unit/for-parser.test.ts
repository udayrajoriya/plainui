import {expect,test} from 'vitest';
import {parseFor} from '../../packages/core/src/structure/for-parser.js';
test('for parser captures aliases and entire expression without splitting inner tokens',()=>{expect(parseFor('item, index in choose(flag, left, right)')).toEqual({item:'item',index:'index',expression:'choose(flag, left, right)'});expect(parseFor('entry in entries')).toEqual({item:'entry',index:null,expression:'entries'});});
test('for parser rejects duplicate, reserved and malformed aliases',()=>{for(const source of ['x, x in items','store in items','a in','a,b,c in items','__proto__ in items'])expect(()=>parseFor(source)).toThrow();});
