import {expect,test} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const css=await readFile('packages/styles/src/plainui.css','utf8');
test.beforeEach(async({page})=>{await page.setViewportSize({width:320,height:720});await page.setContent('<main class="ui-container ui-stack"><div class="ui-grid"><label>Long label text that must wrap safely <input value="value"></label><button id="hidden" hidden>Hidden</button></div></main>');await page.addStyleTag({content:css});});

test('styles.hidden',async({page})=>{await expect(page.locator('#hidden')).toBeHidden();expect(await page.locator('#hidden').evaluate(node=>getComputedStyle(node).display)).toBe('none');});
test('styles.narrow-no-overflow',async({page})=>{expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);});
test('styles.zoom',async({page})=>{await page.evaluate(()=>{document.documentElement.style.zoom='2';});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);});
test('styles.rtl',async({page})=>{await page.locator('main').evaluate(node=>node.setAttribute('dir','rtl'));const values=await page.locator('main').evaluate(node=>{const style=getComputedStyle(node);return {left:style.paddingLeft,right:style.paddingRight};});expect(values.left).toBe(values.right);});
test('styles.reduced-motion',async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});expect(await page.locator('button').evaluate(node=>getComputedStyle(node).transitionDuration)).toBe('0s');});
test('styles.override',async({page})=>{await page.addStyleTag({content:':root{--ui-color-primary:#6d28d9;--ui-space-4:20px}'});expect(await page.locator('main').evaluate(node=>getComputedStyle(node).gap)).toBe('20px');expect(await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--ui-color-primary').trim())).toBe('#6d28d9');});
test('styles.runtime-without-css',async({page})=>{await page.setContent('<button hidden>Native behavior</button><input required>');await expect(page.locator('button')).toBeHidden();expect(await page.locator('input').evaluate((node:HTMLInputElement)=>node.validity.valueMissing)).toBe(true);});
