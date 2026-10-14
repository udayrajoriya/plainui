import {expect,test} from '@playwright/test';
import {build} from 'esbuild';
test('evaluator runs as external script under strict no-eval CSP',async({page})=>{
  const code=(await build({entryPoints:['experiments/evaluator-csp.ts'],bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',minify:true})).outputFiles[0]!.text;
  await page.route('http://eval.test/**',async route=>{
    if(new URL(route.request().url()).pathname==='/')await route.fulfill({status:200,headers:{'content-type':'text/html','content-security-policy':"default-src 'self'; script-src 'self'; object-src 'none'"},body:'<!doctype html><script src="/app.js" defer></script>'});
    else await route.fulfill({status:200,headers:{'content-type':'text/javascript'},body:code});
  });
  await page.goto('http://eval.test/');
  await page.waitForFunction(()=>Boolean(window.__evalCsp),{timeout:2000});
  expect(await page.evaluate(()=>window.__evalCsp)).toEqual({value:5,violations:[]});
});
