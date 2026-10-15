import {expect,test} from '@playwright/test';
import {build} from 'esbuild';

async function load(page:import('@playwright/test').Page){const code=(await build({stdin:{contents:`import * as controls from './packages/forms/src/serialize/successful-controls.ts';import * as json from './packages/forms/src/serialize/json.ts';import * as form from './packages/forms/src/serialize/urlencoded.ts';import * as multipart from './packages/forms/src/serialize/multipart.ts';window.Serial={...controls,...json,...form,...multipart};`,resolveDir:process.cwd()},bundle:true,write:false,format:'iife',platform:'browser'})).outputFiles[0]!.text;await page.addScriptTag({content:code});}

test('form successful controls preserve external order, submitter and disabled fieldset',async({page})=>{
  await page.setContent('<base href="https://example.test/"><input form="f" name="before" value="A"><form id="f"><fieldset disabled><input name="skip" value="bad"></fieldset><input name="x.y" value="literal"><button id="one" name="act" value="one">One</button><button id="two" name="act" value="two">Two</button></form><input form="f" name="after" value="Z">');await load(page);
  const result=await page.evaluate(()=>{const s=(window as any).Serial,form=document.querySelector('#f') as HTMLFormElement,button=document.querySelector('#two') as HTMLButtonElement;return {native:s.supportsSubmitterFormData(form,button),pairs:s.successfulControls(form,button).map((p:any)=>[p.name,p.value]),json:s.jsonControls(s.successfulControls(form,button))};});
  expect(result).toEqual({native:true,pairs:[['before','A'],['x.y','literal'],['act','two'],['after','Z']],json:{before:'A','x.y':'literal',act:'two',after:'Z'}});
});

test('form repeated names, number JSON, checkbox string and GET replacement',async({page})=>{
  await page.setContent('<form id="f"><input name="repeat" value="a"><input name="repeat" value="b"><input type="number" name="n" value="4"><input type="checkbox" name="yes" value="on" checked><input type="number" name="empty"></form>');await load(page);
  const result=await page.evaluate(()=>{const s=(window as any).Serial,pairs=s.successfulControls(document.querySelector('#f'));return {json:s.jsonControls(pairs),encoded:s.urlencodedControls(pairs).toString(),url:s.mergeGetQuery(new URL('https://example.test/?repeat=old&keep=1'),s.urlencodedControls(pairs)).toString()};});
  expect(result.json).toEqual({repeat:['a','b'],n:4,yes:'on',empty:null});expect(result.encoded).toContain('repeat=a&repeat=b');expect(result.url).toContain('keep=1&repeat=a&repeat=b');
});

test('form files reject JSON, omit unselected multipart placeholders and preserve zero-byte files',async({page})=>{
  await page.setContent('<form id="f"><input id="none" type="file" name="none"><input id="chosen" type="file" name="chosen"></form>');await load(page);
  await page.locator('#chosen').setInputFiles({name:'empty.txt',mimeType:'text/plain',buffer:Buffer.alloc(0)});
  const result=await page.evaluate(()=>{const s=(window as any).Serial,pairs=s.successfulControls(document.querySelector('#f'));let rejected=false;try{s.jsonControls(pairs);}catch{rejected=true;}const data=s.multipartControls(pairs);return {rejected,names:[...data.keys()],file:data.get('chosen') instanceof File?(data.get('chosen') as File).name:null,size:(data.get('chosen') as File).size};});
  expect(result).toEqual({rejected:true,names:['chosen'],file:'empty.txt',size:0});
});

test('form image submitter uses captured coordinates at its document position',async({page})=>{
  await page.setContent('<form id="f"><input name="a" value="1"><input id="go" type="image" name="go" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="><input name="b" value="2"></form>');await load(page);
  expect(await page.evaluate(()=>{const s=(window as any).Serial;return s.successfulControls(document.querySelector('#f'),document.querySelector('#go'),{x:3,y:8}).map((p:any)=>[p.name,p.value]);})).toEqual([['a','1'],['go.x','3'],['go.y','8'],['b','2']]);
});
