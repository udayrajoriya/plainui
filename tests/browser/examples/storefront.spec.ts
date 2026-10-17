import {spawn,type ChildProcessWithoutNullStreams} from 'node:child_process';
import {once} from 'node:events';
import {expect,test} from '@playwright/test';

type Backend={base:string;child:ChildProcessWithoutNullStreams;stop():Promise<void>};
async function start(kind:'node'|'python'):Promise<Backend>{
  const child=spawn(kind==='node'?process.execPath:'python',kind==='node'
    ?['examples/backends/node/server.mjs','--host','127.0.0.1','--port','0','--root','examples/storefront','--data-dir',`.tools/store-${kind}`,'--test-mode','true']
    :['examples/backends/python/server.py','--host','127.0.0.1','--port','0','--root','examples/storefront','--data-dir',`.tools/store-${kind}`,'--test-mode'],
  {cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
  let error='';child.stderr.on('data',value=>error+=value);
  const line=await Promise.race([
    new Promise<string>((resolve,reject)=>{let output='';child.stdout.on('data',value=>{output+=value;const end=output.indexOf('\n');if(end>=0)resolve(output.slice(0,end));});child.once('exit',code=>reject(new Error(`store backend exited ${code}: ${error}`)));}),
    new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error(`store backend startup timeout: ${error}`)),5000))]);
  const info=JSON.parse(line);
  return {base:`http://127.0.0.1:${info.port}`,child,stop:async()=>{if(child.exitCode!==null)return;child.kill();await Promise.race([once(child,'exit'),new Promise(resolve=>setTimeout(resolve,3000))]);if(child.exitCode===null)child.kill('SIGKILL');}};
}

for(const kind of ['node','python'] as const)test.describe(`storefront with ${kind} backend`,()=>{
  let backend:Backend;
  test.beforeAll(async()=>backend=await start(kind));
  test.afterAll(async()=>backend.stop());

  test('persists cart, preserves values, trusts server totals, reconciles, and sanitizes summary',async({page})=>{
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/api/orders',async route=>route.continue({headers:{...route.request().headers(),'x-plainui-test-delay':'150'}}));
    await page.goto(backend.base);await expect(page.locator('product-card')).toHaveCount(10);
    expect(await page.evaluate(()=>(globalThis as any).storefrontDiagnostics)).toEqual([]);
    await page.locator('product-card').first().getByRole('button',{name:'Add to cart'}).click();
    await expect(page.locator('section[aria-labelledby="cart-heading"] output')).toHaveText('1');
    expect(await page.evaluate(()=>(globalThis as any).storefrontApp.get('store'))).toEqual({cart:[{productId:'p1',quantity:1}]});
    await page.waitForFunction(()=>localStorage.length===1);

    await page.reload();await expect(page.locator('section[aria-labelledby="cart-heading"] output')).toHaveText('1');
    await page.locator('#client-order').fill('x'.repeat(65));await page.locator('#email').fill('buyer@example.test');await page.locator('#address').fill('1 Main Street');
    await page.getByRole('button',{name:'Place order'}).click();
    await expect(page.locator('[ui-field-error="clientOrderId"]')).toContainText('client order ID');
    await expect(page.locator('#client-order')).toHaveValue('x'.repeat(65));

    await page.reload();await expect(page.locator('section[aria-labelledby="cart-heading"] output')).toHaveText('1');
    await page.locator('#client-order').fill('sample-order');await page.locator('#email').fill('buyer@example.test');await page.locator('#address').fill('1 Main Street');let mutations=0;
    page.on('request',request=>{if(request.method()==='POST'&&request.url().endsWith('/api/orders'))mutations++;});
    const responsePromise=page.waitForResponse(response=>response.request().method()==='POST'&&response.url().endsWith('/api/orders'));
    await page.locator('form[ui-action="checkout"]').evaluate((form:HTMLFormElement)=>{const submitter=form.querySelector('button') as HTMLButtonElement;form.requestSubmit(submitter);form.requestSubmit(submitter);});const response=await responsePromise;
    const wire=await response.json();expect(response.status()).toBeLessThan(300);await expect(page.locator('dialog[open]')).toBeVisible();expect(mutations).toBe(1);
    const order=kind==='python'?wire.payload:wire;expect(order.totalCents).toBe(1200);expect(order.items[0].unitPriceCents).toBe(1200);

    await page.getByRole('button',{name:'Close'}).click();await expect(page.locator('dialog[open]')).toHaveCount(0);await page.getByRole('button',{name:'Load order summary'}).click();
    const summary=page.locator('[ui-ref="summary"]');await expect(summary).toContainText('1200 USD');
    expect(await summary.locator('script,style,[ui-app]').count()).toBe(0);expect(await page.evaluate(()=>(globalThis as any).fragmentAttack)).toBeUndefined();
    await page.getByRole('button',{name:'Check order status'}).click();await expect(page.getByText('The server has this order.')).toBeVisible();
    expect(errors).toEqual([]);expect(await page.evaluate(()=>(globalThis as any).storefrontDiagnostics)).toEqual([]);
  });

  test('retains native fallbacks and works when optional stylesheets fail',async({page})=>{
    await page.route('**/*.css',route=>route.abort());await page.goto(backend.base);
    await expect(page.locator('product-card')).toHaveCount(10);
    await expect(page.locator('form[method="post"][action="/api/orders"]')).toHaveCount(1);
    await expect(page.locator('form[method="get"][action="/api/orders/by-client-id/sample-order"]')).toHaveCount(1);
  });
});
