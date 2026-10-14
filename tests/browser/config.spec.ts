import { expect, test } from '@playwright/test';
import { build } from 'esbuild';

test('config block lookup uses actual document IDs, JSON script type and overrides', async ({page}) => {
  const output=await build({entryPoints:['packages/core/src/config.ts'],bundle:true,write:false,format:'iife',globalName:'ConfigUnderTest',platform:'browser',target:'es2022'});
  await page.setContent('<base href="https://example.test/page"><script id="settings" type="application/json">{"api":{"timeoutMs":40},"locale":"fr-FR"}</script><main id="root" ui-config="settings"></main>');
  await page.addScriptTag({content:output.outputFiles[0]!.text});
  const values=await page.evaluate(()=>{
    const runtime=(window as typeof window & {ConfigUnderTest:{resolveConfiguration:(root:Element,options:unknown)=>{api:{timeoutMs:number};locale:string}}}).ConfigUnderTest;
    const root=document.querySelector('#root')!;
    const options=runtime.resolveConfiguration(root,{api:{timeoutMs:60}});
    return {timeout:options.api.timeoutMs,locale:options.locale};
  });
  expect(values).toEqual({timeout:60,locale:'fr-FR'});
  await page.locator('#root').evaluate(element=>element.setAttribute('ui-config','missing'));
  expect(await page.evaluate(()=>{try{(window as any).ConfigUnderTest.resolveConfiguration(document.querySelector('#root'),{});return false;}catch{return true;}})).toBe(true);
});
