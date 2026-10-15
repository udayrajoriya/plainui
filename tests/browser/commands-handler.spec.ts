import {expect,test} from '@playwright/test';
import {build} from 'esbuild';
test('self filtering precedes synchronous modifiers and once consumption',async({page})=>{
  const code=(await build({entryPoints:['packages/core/src/commands/index.ts'],bundle:true,write:false,format:'iife',globalName:'Commands',platform:'browser'})).outputFiles[0]!.text;
  const ownership=(await build({entryPoints:['packages/core/src/ownership/index.ts'],bundle:true,write:false,format:'iife',globalName:'Ownership',platform:'browser'})).outputFiles[0]!.text;
  await page.setContent('<div id="root"><button id="host"><span id="child">child</span></button></div>');await page.addScriptTag({content:ownership});await page.addScriptTag({content:code});
  const result=await page.evaluate(async()=>{const c=(window as any).Commands,o=(window as any).Ownership,root=document.querySelector('#root')!,host=document.querySelector('#host')!,child=document.querySelector('#child')!;const tree=new o.OwnerTree(root),owner=tree.create(tree.root,'element');const calls:any[]=[];const descriptor=c.parseEventDirective('ui-on:click.self.prevent.stop.once');c.attachEventHandler(tree,owner,host,descriptor,c.parseCommands('emit("x")'),async(_commands:any,snapshot:any)=>{calls.push(snapshot);},()=>{});
    const first=new MouseEvent('click',{bubbles:true,cancelable:true});child.dispatchEvent(first);const second=new MouseEvent('click',{bubbles:true,cancelable:true});host.dispatchEvent(second);const third=new MouseEvent('click',{bubbles:true,cancelable:true});host.dispatchEvent(third);await Promise.resolve();tree.dispose(owner);return {firstPrevented:first.defaultPrevented,secondPrevented:second.defaultPrevented,thirdPrevented:third.defaultPrevented,calls:calls.length,snapshot:calls[0],keys:Object.keys(calls[0])};});
  expect(result).toMatchObject({firstPrevented:false,secondPrevented:true,thirdPrevented:false,calls:1,snapshot:{type:'click',key:null,button:0,value:null,checked:null,detail:null}});expect(result.keys.sort()).toEqual(['button','checked','detail','key','type','value']);
});
test('event snapshots detach JSON detail and exclude DOM references',async({page})=>{
  const code=(await build({entryPoints:['packages/core/src/commands/index.ts'],bundle:true,write:false,format:'iife',globalName:'Commands',platform:'browser'})).outputFiles[0]!.text;
  await page.setContent('<input id="field" value="A">');await page.addScriptTag({content:code});
  const result=await page.evaluate(()=>{const c=(window as any).Commands;const detail={items:[1]};const event=new CustomEvent('change',{detail});document.querySelector('input')!.dispatchEvent(event);const snapshot=c.snapshotEvent(event);detail.items[0]=9;let unsafe=false;try{c.snapshotEvent(new CustomEvent('change',{detail:{element:document.querySelector('input')}}));}catch{unsafe=true;}return {snapshot,unsafe,frozen:Object.isFrozen(snapshot.detail),hasTarget:'target' in snapshot};});
  expect(result).toEqual({snapshot:{type:'change',key:null,button:null,value:'A',checked:null,detail:{items:[1]}},unsafe:true,frozen:true,hasTarget:false});
});
