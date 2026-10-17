import {spawn,type ChildProcessWithoutNullStreams} from 'node:child_process';
import {once} from 'node:events';
import {expect,test} from '@playwright/test';

type Backend={child:ChildProcessWithoutNullStreams;base:string;stop():Promise<void>};
async function start(kind:'node'|'python'):Promise<Backend>{const child=spawn(kind==='node'?process.execPath:'python',kind==='node'?['examples/backends/node/server.mjs','--host','127.0.0.1','--port','0','--root','examples/blog','--data-dir',`.tools/blog-${kind}`,'--test-mode','true']:['examples/backends/python/server.py','--host','127.0.0.1','--port','0','--root','examples/blog','--data-dir',`.tools/blog-${kind}`,'--test-mode'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});let stderr='';child.stderr.on('data',value=>stderr+=value);const line=await Promise.race([new Promise<string>((resolve,reject)=>{let output='';child.stdout.on('data',value=>{output+=value;const newline=output.indexOf('\n');if(newline>=0)resolve(output.slice(0,newline));});child.once('exit',code=>reject(new Error(`blog backend exited ${code}: ${stderr}`)));}),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error(`blog backend startup timeout: ${stderr}`)),5000))]);const info=JSON.parse(line);return {child,base:`http://127.0.0.1:${info.port}`,stop:async()=>{if(child.exitCode!==null)return;child.kill();await Promise.race([once(child,'exit'),new Promise(resolve=>setTimeout(resolve,3000))]);if(child.exitCode===null)child.kill('SIGKILL');}};}

for(const kind of ['node','python'] as const)test.describe(`blog with ${kind} backend`,()=>{
  let backend:Backend;
  test.beforeAll(async()=>{backend=await start(kind);});
  test.afterAll(async()=>backend.stop());

  test('keeps server documents readable and enhances search, routes, retry, and fragments',async({page,request})=>{
    const browserErrors:string[]=[];page.on('pageerror',error=>browserErrors.push(error.message));page.on('console',message=>{if(message.type()==='error')browserErrors.push(message.text());});
    const serverArticle=await request.get(`${backend.base}/articles/a1`);expect(serverArticle.status()).toBe(200);expect(await serverArticle.text()).toContain('PlainUI begins with ordinary HTML');
    await page.goto(backend.base);await page.waitForTimeout(250);expect(browserErrors).toEqual([]);await expect(page.locator('main[ui-app]')).toBeVisible();const debug=await page.evaluate(()=>({diagnostics:(globalThis as any).blogDiagnostics,articles:(globalThis as any).blogApp?.get('articles')}));expect(debug).toMatchObject({diagnostics:[],articles:{status:'success',data:{total:3}}});await expect(page.locator('article-card')).toHaveCount(3);
    await page.locator('#query').fill('no matching title');await expect.poll(()=>page.evaluate(()=>(globalThis as any).blogApp.get('query'))).toBe('no matching title');await page.getByRole('button',{name:'Search'}).click();await expect.poll(()=>page.evaluate(()=>(globalThis as any).blogApp.get('articles').data?.total)).toBe(0);await expect(page.getByText('No articles match this search.')).toBeVisible();
    await page.locator('#query').fill('');await page.getByRole('button',{name:'Search'}).click();await expect(page.locator('article-card')).toHaveCount(3);
    let failed=false;await page.route('**/api/articles?q=retry',async route=>{if(!failed){failed=true;await route.fulfill({status:503,contentType:'application/json',body:kind==='node'?'{"code":"DOWN","message":"Try again","fields":{}}':'{"error":{"type":"DOWN","detail":"Try again","violations":[]},"trace":"test"}'});}else await route.continue();});
    await page.locator('#query').fill('retry');await expect(page.getByRole('alert')).toBeVisible();await page.getByRole('button',{name:'Try again'}).click();await expect(page.getByText('No articles match this search.')).toBeVisible();
    await page.unroute('**/api/articles?q=retry');await page.goto(backend.base);await expect(page.locator('article-card')).toHaveCount(3);await page.locator('article-card a').first().click();await expect(page).toHaveURL(/\/articles\/a1$/u);await expect(page.locator('[ui-outlet] h1')).toBeFocused();
    const fragmentResponse=page.waitForResponse(response=>response.url().includes('/fragments/articles/'));await page.getByRole('button',{name:'Load article body'}).click();expect((await fragmentResponse).status()).toBe(200);await expect(page.locator('[ui-ref="articleBody"] article')).toContainText('PlainUI begins with ordinary HTML');expect(await page.locator('[ui-ref="articleBody"] script, [ui-ref="articleBody"] style, [ui-ref="articleBody"] [ui-app]').count()).toBe(0);
    await page.getByRole('link',{name:'Back to articles'}).click();await expect(page).toHaveURL(/\/$/u);
  });
});
