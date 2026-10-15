import {expect,test} from '@playwright/test';
import {build} from 'esbuild';
test('external additions, moves and directive edits reconcile without remounting framework DOM',async({page})=>{
  const code=(await build({entryPoints:['packages/runtime/src/esm.ts'],bundle:true,write:false,format:'iife',globalName:'Runtime',platform:'browser'})).outputFiles[0]!.text;
  await page.setContent('<base href="https://example.test/"><main ui-app="observe" ui-state="{&quot;count&quot;:1}"><div id="a" ui-state="{&quot;x&quot;:1}"><div id="a1"></div><div id="a2"></div></div><div id="b" ui-state="{&quot;x&quot;:2}"></div><div id="ignored" ui-ignore></div></main>');await page.addScriptTag({content:code});
  const result=await page.evaluate(async()=>{const app=(window as any).Runtime.PlainUI.mount(document.querySelector('main'));const errors:string[]=[];app.onDiagnostic((d:any)=>errors.push(d.code));await app.ready;
    const span=document.createElement('span');span.setAttribute('ui-text','x');document.querySelector('#a1')!.append(span);await new Promise(resolve=>setTimeout(resolve,0));const initial=span.textContent;const owner1=app.planOwners.get(span);
    document.querySelector('#a2')!.append(span);await new Promise(resolve=>setTimeout(resolve,0));const sameOwner=app.planOwners.get(span)===owner1;
    document.querySelector('#b')!.append(span);await new Promise(resolve=>setTimeout(resolve,0));const changed=span.textContent;const newOwner=app.planOwners.get(span)!==owner1;
    span.setAttribute('ui-text','count');await new Promise(resolve=>setTimeout(resolve,0));const retained=span.textContent;const beforeReinsertOwner=app.planOwners.get(span);
    const ignored=document.createElement('span');ignored.setAttribute('ui-text','count');document.querySelector('#ignored')!.append(ignored);await new Promise(resolve=>setTimeout(resolve,0));
    span.remove();document.querySelector('#b')!.append(span);await new Promise(resolve=>setTimeout(resolve,0));const reinsert=span.textContent;const retainedOwner=app.planOwners.get(span)===beforeReinsertOwner;return {initial,sameOwner,changed,newOwner,retained,ignored:ignored.textContent,reinsert,retainedOwner,changedDiagnostic:errors.includes('DECLARATION_CHANGED')};});
  expect(result).toEqual({initial:'1',sameOwner:true,changed:'2',newOwner:true,retained:'2',ignored:'',reinsert:'2',retainedOwner:true,changedDiagnostic:true});
});




