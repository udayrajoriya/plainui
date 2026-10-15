import {expect,test} from '@playwright/test';
import {build} from 'esbuild';

async function runtime(){return (await build({entryPoints:['packages/runtime/src/esm.ts'],bundle:true,write:false,format:'iife',globalName:'Runtime',platform:'browser'})).outputFiles[0]!.text;}
test('commands read prior writes, emit detached detail and stop after failure',async({page})=>{
  await page.setContent('<base href="https://example.test/"><main ui-app="one" ui-state=\'{"count":0,"flag":false}\'><button id="go" ui-on:click=\'set(count,count+1);toggle(flag);emit("changed", {"value":count})\'></button><button id="bad" ui-on:click=\'toggle(count);set(count,99)\'></button></main>');await page.addScriptTag({content:await runtime()});
  const result=await page.evaluate(async()=>{const app=(window as any).Runtime.PlainUI.create();const errors:string[]=[];app.onDiagnostic((item:any)=>errors.push(item.code));app.mount(document.querySelector('main'));await app.ready;let detail:any;document.querySelector('main')!.addEventListener('changed',(event:any)=>detail=event.detail);(document.querySelector('#go') as HTMLElement).click();await new Promise(resolve=>setTimeout(resolve,0));(document.querySelector('#bad') as HTMLElement).click();await new Promise(resolve=>setTimeout(resolve,0));return {count:app.get('count'),flag:app.get('flag'),detail,errors};});
  expect(result).toEqual({count:1,flag:true,detail:{value:1},errors:['COMMAND_ERROR']});
});
test('custom commands run sequentially and retained scope rejects writes after disposal',async({page})=>{
  await page.setContent('<base href="https://example.test/"><main ui-app="one" ui-state=\'{"count":0}\'><button ui-on:click="later();set(count,count+1)"></button></main>');await page.addScriptTag({content:await runtime()});
  const result=await page.evaluate(async()=>{const api=(window as any).Runtime.PlainUI;const app=api.create();let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);let retained:any;app.extensions.registerCommand('later',async(context:any)=>{retained=context.scope;await gate;});app.mount(document.querySelector('main'));await app.ready;(document.querySelector('button') as HTMLElement).click();await Promise.resolve();app.unmount();release();await new Promise(resolve=>setTimeout(resolve,0));let code='';try{retained.set('count',7);}catch(error){code=(error as any).code;}return {code,status:app.status};});
  expect(result).toEqual({code:'OWNER_DISPOSED',status:'unmounted'});
});
test('focus waits for flush and missing optional services diagnose locally',async({page})=>{
  await page.setContent('<base href="https://example.test/"><main ui-app="one"><input ui-ref="field"><button id="focus" ui-on:click=\'focus("field")\'></button><button id="open" ui-on:click=\'open("dialog")\'></button><button id="reset" ui-on:click=\'reset("form")\'></button></main>');await page.addScriptTag({content:await runtime()});
  const result=await page.evaluate(async()=>{const app=(window as any).Runtime.PlainUI.create();const errors:string[]=[];app.onDiagnostic((item:any)=>errors.push(item.code));app.mount(document.querySelector('main'));await app.ready;(document.querySelector('#focus') as HTMLElement).click();const immediately=document.activeElement?.tagName;await new Promise(resolve=>setTimeout(resolve,0));const focused=document.activeElement?.tagName;(document.querySelector('#open') as HTMLElement).click();(document.querySelector('#reset') as HTMLElement).click();await new Promise(resolve=>setTimeout(resolve,0));return {immediately,focused,errors};});
  expect(result).toEqual({immediately:'BODY',focused:'INPUT',errors:['MODULE_MISSING','MODULE_MISSING']});
});
