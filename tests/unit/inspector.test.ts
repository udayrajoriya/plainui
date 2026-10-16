import {describe,expect,test} from 'vitest';
import {Inspector} from '../../packages/core/src/diagnostics/inspector.js';
import {OwnerTree} from '../../packages/core/src/ownership/owner.js';

describe('T080 inspector accounting',()=>{
  test('inspect.shared-counts counts a destination range once and linked consumers separately',()=>{
    const before=globalThis.Element;class FakeElement {childNodes:Node[]=[]}
    Object.defineProperty(globalThis,'Element',{value:FakeElement,configurable:true});
    try {const document={createComment:(text:string)=>({text})} as unknown as Document;const element=new FakeElement() as unknown as Element;
      const tree=new OwnerTree(element),range=tree.create(tree.root,'fragment'),first=tree.create(tree.root,'element'),second=tree.create(tree.root,'element');
      range.range={start:document.createComment('start'),end:document.createComment('end'),owner:range};tree.linkLifetime(first,range);tree.linkLifetime(second,range);
      const snapshot=tree.snapshot();expect(snapshot.ranges).toBe(1);expect(snapshot.rangeConsumers).toBe(2);expect(snapshot.byKind.fragment).toBe(1);
    } finally {Object.defineProperty(globalThis,'Element',{value:before,configurable:true});}
  });
  test('inspect.frozen freezes nested records and balanced counters reach zero',()=>{
    const inspector=new Inspector(true),release=inspector.allocate('listeners'),snapshot=inspector.snapshot();
    expect(Object.isFrozen(snapshot)).toBe(true);expect(Object.isFrozen(snapshot.root)).toBe(true);expect(Object.isFrozen(snapshot.ownersByKind)).toBe(true);expect(Object.isFrozen(snapshot.resources)).toBe(true);
    release();expect(inspector.zero()).toBe(true);
  });
});
