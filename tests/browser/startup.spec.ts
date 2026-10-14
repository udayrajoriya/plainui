import {expect,test} from '@playwright/test';
import {build} from 'esbuild';

async function runtime(){return (await build({entryPoints:['packages/runtime/src/esm.ts'],bundle:true,write:false,format:'iife',globalName:'Runtime',platform:'browser'})).outputFiles[0]!.text;}
async function classic(){return (await build({entryPoints:['packages/runtime/src/classic.ts'],bundle:true,write:false,format:'iife',platform:'browser'})).outputFiles[0]!.text;}
test('boot.esm-explicit, ready, same-app-repeat and unmount',async({page})=>{
  await page.setContent('<base href="https://example.test/"><main ui-app="one" ui-state="{&quot;count&quot;:1}"><span ui-text="count" ui-cloak></span></main>');await page.addScriptTag({content:await runtime()});
  const result=await page.evaluate(async()=>{const api=(window as any).Runtime.PlainUI;const root=document.querySelector('main')!;const app=api.create();const same=app.mount(root)===app&&app.mount(root)===app;await app.ready;const count=app.get('count');const first=root.querySelector('span')!.textContent;const cloaked=root.querySelector('span')!.hasAttribute('ui-cloak');app.set('count',2);await new Promise(resolve=>setTimeout(resolve,0));const updated=app.get('count');const text=root.querySelector('span')!.textContent;let otherError='';try{api.mount(root);}catch(e){otherError=(e as any).code;}app.unmount();app.unmount();return {same,count,first,cloaked,updated,text,otherError,status:app.status};});
  expect(result).toEqual({same:true,count:1,first:'1',cloaked:false,updated:2,text:'2',otherError:'ROOT_INVALID',status:'unmounted'});
});
test('boot.nested and duplicate-name are rejected',async({page})=>{
  await page.setContent('<base href="https://example.test/"><div ui-app="same" id="a"><div id="nested" ui-app="child"></div></div><div id="b" ui-app="same"></div>');await page.addScriptTag({content:await runtime()});
  const result=await page.evaluate(()=>{const api=(window as any).Runtime.PlainUI;return ['a','nested'].map(id=>{try{api.mount(document.getElementById(id));return 'mounted';}catch(e){return (e as any).code;}});});
  expect(result).toEqual(['ROOT_INVALID','ROOT_INVALID']);
});
test('boot.classic-auto runs one discovery pass',async({page})=>{
  await page.setContent('<base href="https://example.test/"><main id="first" ui-app="one"></main>');await page.addScriptTag({content:await classic()});
  await page.waitForFunction(()=>Boolean((document as any)[Symbol.for('plainui.document.mounts.v1')]?.roots.size));
  const result=await page.evaluate(async()=>{const registry=(document as any)[Symbol.for('plainui.document.mounts.v1')];const app=registry.roots.get(document.querySelector('#first'));await app.ready;const second=document.createElement('main');second.setAttribute('ui-app','two');document.body.append(second);await new Promise(resolve=>setTimeout(resolve,0));const before=registry.roots.size;(window as any).PlainUI.mount(second);return {before,after:registry.roots.size,status:app.status};});
  expect(result).toEqual({before:1,after:2,status:'mounted'});
});
test('boot.unmount-during-initial-pass rejects ready',async({page})=>{
  await page.setContent('<base href="https://example.test/"><main ui-app="one"><template ui-import="/component.html"></template></main>');await page.addScriptTag({content:await runtime()});
  const result=await page.evaluate(async()=>{const app=(window as any).Runtime.PlainUI.mount(document.querySelector('main'));const ready=app.ready.then(()=>false,()=>true);app.unmount();return {rejected:await ready,status:app.status};});
  expect(result).toEqual({rejected:true,status:'unmounted'});
});
test('boot.ready waits for bounded imports while independent text activates',async({page})=>{
  await page.route('https://example.test/component.html',async route=>{await new Promise(resolve=>setTimeout(resolve,100));await route.fulfill({status:200,contentType:'text/html',body:'<template ui-component="Card"><span>Card</span></template>'});});
  await page.setContent('<base href="https://example.test/"><main ui-app="one" ui-state="{&quot;name&quot;:&quot;A&quot;}"><span ui-text="name"></span><template ui-import="/component.html"></template></main>');await page.addScriptTag({content:await runtime()});
  const result=await page.evaluate(async()=>{const app=(window as any).Runtime.PlainUI.mount(document.querySelector('main'));const first=document.querySelector('span')!.textContent;await app.ready;return {first,imports:app.imports.size,status:app.status};});
  expect(result).toEqual({first:'',imports:1,status:'mounted'});
});
