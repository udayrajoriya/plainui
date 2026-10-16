import {expect,test} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {extname,join,resolve} from 'node:path';

const packaged=resolve(import.meta.dirname,'../../.tools/package/plainui');
const types:Record<string,string>={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
async function serve(page:import('@playwright/test').Page,html:string):Promise<void>{
  await page.route('http://package.test/**',async route=>{const url=new URL(route.request().url());if(url.pathname==='/'){await route.fulfill({body:html,contentType:'text/html'});return;}const name=url.pathname.slice(1);if(name.includes('/')||name.includes('..')){await route.fulfill({status:404});return;}try{await route.fulfill({body:await readFile(join(packaged,name)),contentType:types[extname(name)]??'application/octet-stream'});}catch{await route.fulfill({status:404});}});
  await page.goto('http://package.test/');
}

test('package.zero-build loads local optional modules before classic DOM-ready boot',async({page})=>{
  const requests:string[]=[];page.on('request',request=>requests.push(request.url()));
  await serve(page,`<!doctype html><link rel="stylesheet" href="/plainui.css"><script src="/plainui.js"></script><script src="/plainui-router.js"></script><script src="/plainui-fragments.js"></script><script src="/plainui-ui.js"></script><script>globalThis.modules=PlainUI.create().installedModules</script><main ui-app="demo" ui-state='{"message":"ready"}'><span id="value" ui-text="message"></span><div ui-outlet></div><template ui-route="*"><p>route</p></template></main>`);
  await expect(page.locator('#value')).toHaveText('ready');
  expect(await page.evaluate(()=>(globalThis as any).modules)).toEqual(['router','fragments','ui']);
  expect(requests.every(url=>url.startsWith('http://package.test/'))).toBe(true);
});

test('package.classic-esm-parity keeps ESM inert and rejects one duplicate mount without duplicate listeners',async({page})=>{
  await serve(page,`<!doctype html><main ui-app="demo" ui-state='{"count":0}'><button id="button" ui-on:click="set(count,count+1)">Add</button><span id="count" ui-text="count"></span></main><script type="module">import {PlainUI} from '/plainui.mjs';globalThis.esm=PlainUI;globalThis.esmReady=true;</script>`);
  await page.waitForFunction(()=>(globalThis as any).esmReady);
  expect(await page.locator('#count').textContent()).toBe('');
  await page.addScriptTag({url:'http://package.test/plainui.js'});
  await expect(page.locator('#count')).toHaveText('0');
  const code=await page.evaluate(()=>{try{(globalThis as any).esm.mount(document.querySelector('main'));return 'mounted';}catch(error){return (error as any).code;}});
  expect(code).toBe('ROOT_INVALID');
  await page.locator('#button').click();await expect(page.locator('#count')).toHaveText('1');
});
