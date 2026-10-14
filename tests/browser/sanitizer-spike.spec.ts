import { expect,test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

test('spike.csp-template, spike.csp-fragment, spike.no-script-execution and spike.allowlist',async({page})=>{
  const csp="default-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; trusted-types plainui-template dompurify; require-trusted-types-for 'script'";
  await page.route('http://spike.test/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/'){await route.fulfill({status:200,headers:{'content-type':'text/html','content-security-policy':csp},body:'<!doctype html><html><head><script src="/exercise.js" defer></script><script src="/template.js" defer></script><script src="/sanitizer.js" defer></script><script src="/run.js" defer></script></head><body><div id="component"></div><div id="fragment"></div><div id="enhanced"></div></body></html>'});return;}
    const file=path==='/component.html'?join('experiments/sanitizer/component.html'):path==='/sanitizer.js'||path==='/template.js'?join('experiments/sanitizer/dist',path.slice(1)):join('experiments/sanitizer',path.slice(1));
    try{await route.fulfill({status:200,headers:{'content-type':path.endsWith('.js')?'text/javascript':'text/html'},body:await readFile(file)});}catch{await route.fulfill({status:404,body:''});}
  });
  await page.goto('http://spike.test/');
  await page.waitForFunction(()=>Boolean((window as any).spike?.done),{timeout:3000});
  const result=await page.evaluate(()=>({spike:(window as any).spike,executed:(window as any).__executed??false,component:document.querySelector('#component')?.textContent,ordinary:document.querySelector('#fragment')?.innerHTML,enhanced:document.querySelector('#enhanced')?.innerHTML}));
  expect(result.spike.error).toBeUndefined();expect(result.spike.violations).toEqual([]);expect(result.spike.badImportRejected).toBe(true);expect(result.executed).toBe(false);expect(result.component).toContain('Native component');
  expect(result.ordinary).toContain('<b>safe</b>');expect(result.ordinary).not.toMatch(/ui-state|data-ui-text|onclick|script/);
  expect(result.enhanced).toContain('ui-text');expect(result.enhanced).toContain('data-ui-state');expect(result.enhanced).not.toContain('ui-app');expect(result.enhanced).toContain('template');
});
