import {expect,test} from '@playwright/test';
import {build} from 'esbuild';

test('owner disposal is ordered, reentrant, isolated and once-only',async({page})=>{
  const code=(await build({entryPoints:['packages/core/src/ownership/index.ts'],bundle:true,write:false,format:'iife',globalName:'Ownership',platform:'browser',target:'es2022'})).outputFiles[0]!.text;
  await page.setContent('<div id="root"><div id="child"></div></div>');await page.addScriptTag({content:code});
  const result=await page.evaluate(()=>{
    const api=(window as any).Ownership;const root=document.querySelector('#root')!;const errors:string[]=[];
    const tree=new api.OwnerTree(root,(e:Error)=>errors.push(e.message));const parent=tree.create(tree.root,'element');const child=tree.create(parent,'element');
    const order:string[]=[];tree.registerDisposer(parent,()=>order.push('parent-connected:'+root.isConnected));
    tree.registerDisposer(child,()=>{order.push('child-connected:'+root.isConnected);tree.dispose(parent);throw new Error('expected');});
    tree.registerDisposer(child,()=>order.push('child-first'));
    tree.dispose(parent);tree.dispose(parent);tree.dispose(tree.root);
    return {order,errors,active:[parent.active,child.active,tree.root.active],live:tree.liveCount};
  });
  expect(result.order).toEqual(['child-first','child-connected:true','parent-connected:true']);expect(result.errors).toEqual(['expected']);expect(result.active).toEqual([false,false,false]);expect(result.live).toBe(0);
});

test('range moves preserve focus and broken anchors diagnose',async({page})=>{
  const code=(await build({entryPoints:['packages/core/src/ownership/index.ts'],bundle:true,write:false,format:'iife',globalName:'Ownership',platform:'browser',target:'es2022'})).outputFiles[0]!.text;
  await page.setContent('<div id="root"><div id="a"></div><div id="b"></div></div>');await page.addScriptTag({content:code});
  const result=await page.evaluate(()=>{
    const api=(window as any).Ownership;const root=document.querySelector('#root')!;const errors:string[]=[];const tree=new api.OwnerTree(root,(e:Error)=>errors.push((e as any).code??e.message));
    const owner=tree.create(tree.root,'fragment');const range=api.createRange(tree,owner,document);const content=document.createDocumentFragment();const button=document.createElement('button');button.textContent='focus';content.append(button);api.insertRange(tree,range,document.querySelector('#a'),null,content);button.focus();api.moveRange(tree,range,document.querySelector('#b'),null);
    const focused=document.activeElement===button;const indexed=tree.ownerOf(button)===owner;range.end.remove();let broken=false;try{api.moveRange(tree,range,document.querySelector('#a'),null);}catch(e){broken=(e as any).code==='OWNER_RANGE';}tree.dispose(owner);tree.dispose(tree.root);
    return {focused,indexed,broken,errors,live:tree.liveCount};
  });
  expect(result).toMatchObject({focused:true,indexed:true,broken:true,live:0});expect(result.errors).toContain('OWNER_RANGE');
});
