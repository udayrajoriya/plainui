import {expect,test} from '@playwright/test';
import {build} from 'esbuild';

async function runtime(){return (await build({entryPoints:['packages/runtime/src/esm.ts'],bundle:true,write:false,format:'iife',globalName:'Runtime',platform:'browser'})).outputFiles[0]!.text;}
async function mount(page:import('@playwright/test').Page){await page.addScriptTag({content:await runtime()});await page.evaluate(async()=>{(window as any).app=(window as any).Runtime.PlainUI.mount(document.querySelector('main'));await (window as any).app.ready;});}
const base='<base href="https://example.test/">';

test('submit.required validates before network and uses the actual button',async({page})=>{
  let calls=0,body='';await page.route('https://example.test/api/save',async route=>{calls++;body=route.request().postData()??'';await route.fulfill({status:200,contentType:'application/json',body:'1'});});
  await page.setContent(`${base}<main ui-app="one"><form action="/api/save" method="post" ui-post="/api/save" ui-action="save"><input id="name" name="name" required><button id="one" name="which" value="one">One</button><button id="two" name="which" value="two">Two</button></form></main>`);await mount(page);
  await page.locator('#two').click();expect(calls).toBe(0);await expect(page.locator('#name')).toBeFocused();
  await page.locator('#name').fill('Ada');await page.locator('#two').click();await expect.poll(()=>calls).toBe(1);expect(JSON.parse(body)).toEqual({name:'Ada',which:'two'});
});

test('submit.novalidate and formnovalidate permit invalid native controls',async({page})=>{
  let calls=0;await page.route('https://example.test/api/save',route=>{calls++;return route.fulfill({status:200,contentType:'application/json',body:'1'});});
  await page.setContent(`${base}<main ui-app="one"><form id="f" action="/api/save" method="post" ui-post="/api/save"><input required name="x"><button id="go" formnovalidate>Go</button></form></main>`);await mount(page);await page.locator('#go').click();await expect.poll(()=>calls).toBe(1);
  await page.evaluate(()=>{document.querySelector('#go')!.removeAttribute('formnovalidate');(document.querySelector('#f') as HTMLFormElement).noValidate=true;});await page.locator('#go').click();await expect.poll(()=>calls).toBe(2);
});

test('submit.requestSubmit snapshots fields before debounce and Enter chooses a submitter',async({page})=>{
  const bodies:string[]=[];await page.route('https://example.test/api/save',route=>{bodies.push(route.request().postData()??'');return route.fulfill({status:200,contentType:'application/json',body:'1'});});
  await page.setContent(`${base}<main ui-app="one"><form id="f" action="/api/save" method="post" ui-post="/api/save" ui-action="save" ui-debounce="100"><input id="name" name="name" value="first"><button id="go" name="which" value="go">Go</button></form></main>`);await mount(page);
  await page.evaluate(()=>(document.querySelector('#f') as HTMLFormElement).requestSubmit(document.querySelector('#go') as HTMLButtonElement));await page.locator('#name').fill('later');await expect.poll(()=>bodies.length).toBe(1);expect(JSON.parse(bodies[0]!)).toEqual({name:'first',which:'go'});
  await page.locator('#name').press('Enter');await expect.poll(()=>bodies.length).toBe(2);expect(JSON.parse(bodies[1]!)).toEqual({name:'later',which:'go'});
});

test('submit.prepare-reject records a local error without replay or transmission',async({page})=>{
  let calls=0;await page.route('https://example.test/api/save',route=>{calls++;return route.fulfill({status:200,contentType:'application/json',body:'1'});});
  await page.setContent(`${base}<main ui-app="one"><form action="/api/save" method="post" ui-post="/api/save" ui-action="save"><input id="file" type="file" name="file"><button id="go">Go</button></form></main>`);await mount(page);
  await page.locator('#go').click();await expect.poll(()=>page.evaluate(()=>(window as any).app.get('save').status)).toBe('error');expect(calls).toBe(0);expect(await page.locator('#file').inputValue()).toBe('');
});

test('submit.native-invalid-config remains an ordinary form',async({page})=>{
  await page.setContent(`${base}<main ui-app="one"><form id="f" action="/api/save" method="get" ui-post="/api/save"><button>Go</button></form></main>`);await mount(page);
  expect(await page.evaluate(()=>{const event=new Event('submit',{bubbles:true,cancelable:true});document.querySelector('#f')!.dispatchEvent(event);return event.defaultPrevented;})).toBe(false);
});
