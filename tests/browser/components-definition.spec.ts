import {expect,test} from '@playwright/test';
import {build} from 'esbuild';

async function definitions(){return (await build({stdin:{contents:`import {ComponentRegistry} from './packages/components/src/registry.ts';import {discoverInline} from './packages/components/src/discover.ts';window.Definitions={ComponentRegistry,discoverInline};`,resolveDir:process.cwd()},bundle:true,write:false,format:'iife',platform:'browser'})).outputFiles[0]!.text;}

test('component.forward-definition and immutable source',async({page})=>{
  await page.setContent('<main id="root"><x-card></x-card><template ui-component="x-card" ui-props=\'{"title":{"type":"string","required":true}}\' ui-state=\'{"open":false}\'><h2 id="heading" ui-text="title"></h2><slot></slot></template></main>');await page.addScriptTag({content:await definitions()});
  const result=await page.evaluate(()=>{const d=(window as any).Definitions,errors:string[]=[],registry=new d.ComponentRegistry((error:any)=>errors.push(error.code));d.discoverInline(document.querySelector('#root'),registry);const definition=registry.get('x-card');document.querySelector('template')!.innerHTML='<p>changed</p>';const clone=definition.clone();return {names:registry.names(),errors,state:definition.state,props:definition.props,markup:(()=>{const wrapper=document.createElement('div');wrapper.append(clone);return wrapper.innerHTML;})(),ids:[...definition.ids],plan:definition.plan.length};});
  expect(result.names).toEqual(['x-card']);expect(result.errors).toEqual([]);expect(result.state).toEqual({open:false});expect(result.props.title).toEqual({type:'string',required:true});expect(result.markup).toContain('<h2 id="heading"');expect(result.ids).toEqual(['heading']);expect(result.plan).toBe(2);
});

test('component.duplicate, ui-prefix, custom-element collision and bad schema are localized',async({page})=>{
  await page.setContent('<main id="root"><template ui-component="x-dup"></template><template ui-component="x-dup"></template><template ui-component="ui-private"></template><template ui-component="x-native"></template><template ui-component="x-bad" ui-props=\'{"count":{"type":"number","default":"wrong"}}\'></template><template ui-component="x-good"><p>Safe</p></template></main>');await page.addScriptTag({content:await definitions()});
  const result=await page.evaluate(()=>{customElements.define('x-native',class extends HTMLElement{});const d=(window as any).Definitions,errors:string[]=[],registry=new d.ComponentRegistry((error:any)=>errors.push(error.code));d.discoverInline(document.querySelector('#root'),registry);registry.freeze();let frozen=false;try{registry.register(document.querySelector('template')!);}catch{frozen=true;}return {names:registry.names(),errors,frozen,duplicate:registry.get('x-dup')===undefined};});
  expect(result.names).toEqual(['x-good']);expect(result.errors).toEqual(['COMPONENT_DEFINITION','COMPONENT_DEFINITION','COMPONENT_DEFINITION','COMPONENT_DEFINITION']);expect(result.frozen).toBe(true);expect(result.duplicate).toBe(true);
});

test('component.other-root-same-name and inactive template definitions remain separate',async({page})=>{
  await page.setContent('<main id="a"><template ui-component="x-card"></template><template ui-if="false"><template ui-component="x-hidden"></template></template></main><main id="b"><template ui-component="x-card"></template></main>');await page.addScriptTag({content:await definitions()});
  expect(await page.evaluate(()=>{const d=(window as any).Definitions,a=new d.ComponentRegistry(()=>{}),b=new d.ComponentRegistry(()=>{});d.discoverInline(document.querySelector('#a'),a);d.discoverInline(document.querySelector('#b'),b);return {a:a.names(),b:b.names()};})).toEqual({a:['x-card'],b:['x-card']});
});

test('component.duplicate slot and static ID diagnostics do not mutate source',async({page})=>{
  await page.setContent('<main id="root"><template ui-component="x-slots"><slot name="a"></slot><slot name="a"></slot></template><template ui-component="x-ids"><p id="same"></p><p id="same"></p></template></main>');await page.addScriptTag({content:await definitions()});expect(await page.evaluate(()=>{const d=(window as any).Definitions,errors:string[]=[],registry=new d.ComponentRegistry((error:any)=>errors.push(error.code));d.discoverInline(document.querySelector('#root'),registry);return {errors,markup:[...document.querySelectorAll('template')].map((item:any)=>item.innerHTML)};})).toEqual({errors:['SLOT_INVALID','COMPONENT_DEFINITION'],markup:['<slot name="a"></slot><slot name="a"></slot>','<p id="same"></p><p id="same"></p>']});
});
