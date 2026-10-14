import {expect,test} from '@playwright/test';
import {build} from 'esbuild';
test('App conditional branch reacts to state and disposes the old DOM',async({page})=>{
  const code=(await build({entryPoints:['packages/runtime/src/esm.ts'],bundle:true,write:false,format:'iife',globalName:'Runtime',platform:'browser'})).outputFiles[0]!.text;
  await page.setContent('<base href="https://example.test/"><main ui-app="demo" ui-state="{&quot;show&quot;:true,&quot;name&quot;:&quot;A&quot;}"><template ui-if="show"><span id="yes" ui-text="name"></span></template><template ui-else><span id="no">No</span></template></main>');await page.addScriptTag({content:code});
  const result=await page.evaluate(async()=>{const app=(window as any).Runtime.PlainUI.mount(document.querySelector('main'));await app.ready;const first=document.querySelector('#yes')!;const text=first.textContent;app.set('show',false);await new Promise(resolve=>setTimeout(resolve,0));const oldConnected=first.isConnected;const no=Boolean(document.querySelector('#no'));app.set('show',true);await new Promise(resolve=>setTimeout(resolve,0));return {text,oldConnected,no,yes:document.querySelector('#yes')?.textContent};});
  expect(result).toEqual({text:'A',oldConnected:false,no:true,yes:'A'});
});
test('conditional chains group whitespace and preserve unchanged branches',async({page})=>{
  const code=(await build({entryPoints:['packages/core/src/structure/conditional.ts'],bundle:true,write:false,format:'iife',globalName:'Conditional',platform:'browser'})).outputFiles[0]!.text;
  const ownership=(await build({entryPoints:['packages/core/src/ownership/index.ts'],bundle:true,write:false,format:'iife',globalName:'Ownership',platform:'browser'})).outputFiles[0]!.text;
  await page.setContent('<div id="root"><template ui-if="first"><button id="a">A</button></template> \n<!-- gap --><template ui-else-if="second"><button id="b">B</button></template><template ui-else><button id="c">C</button></template></div>');await page.addScriptTag({content:ownership});await page.addScriptTag({content:code});
  const result=await page.evaluate(()=>{const c=(window as any).Conditional,o=(window as any).Ownership,root=document.querySelector('#root')!;const tree=new o.OwnerTree(root);const spec=c.collectConditionalChains(root)[0];let first=true,second=false,activations=0;const errors:string[]=[];const chain=new c.ConditionalChain(tree,tree.root,spec,(expression:string)=>({ok:true,value:expression==='first'?first:second}),()=>activations++,(error:Error)=>errors.push((error as any).code));
    chain.update();const original=document.querySelector('#a');chain.update();const preserved=document.querySelector('#a')===original;first=false;second=true;chain.update();const b=Boolean(document.querySelector('#b'));second=false;chain.update();const elseBranch=Boolean(document.querySelector('#c'));tree.dispose(tree.root);return {count:spec.branches.length,preserved,b,elseBranch,activations,errors,live:tree.liveCount};});
  expect(result).toEqual({count:3,preserved:true,b:true,elseBranch:true,activations:3,errors:[],live:0});
});
