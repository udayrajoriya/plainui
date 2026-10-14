import {expect,test} from '@playwright/test';
import {build} from 'esbuild';
test('text, attribute, URL, class and show sinks obey their ownership rules',async({page})=>{
  const code=(await build({entryPoints:['packages/core/src/bindings/index.ts'],bundle:true,write:false,format:'iife',globalName:'Bindings',platform:'browser'})).outputFiles[0]!.text;
  await page.setContent('<base href="https://example.test/"><div id="root"><span id="text"></span><input id="input"><a id="link" href="https://old.test/" aria-label="old"></a><div id="class" class="static"></div><div id="show"></div></div>');await page.addScriptTag({content:code});
  const result=await page.evaluate(()=>{const b=(window as any).Bindings;const text=document.querySelector('#text')!,input=document.querySelector('#input')!,link=document.querySelector('#link')!,classes=document.querySelector('#class')!,show=document.querySelector('#show')!;
    b.setText(text,'<script>alert(1)</script>');const literal=text.innerHTML;let objectCode='';try{b.setText(text,{a:1});}catch(e){objectCode=(e as any).code;}
    b.setAttribute(input,'value','A');b.setAttribute(input,'checked',true);b.setAttribute(link,'aria-label',false);const aria=link.getAttribute('aria-label');let unsafe='';try{b.setAttribute(link,'href','javascript:alert(1)');}catch(e){unsafe=(e as any).code;}const href=link.getAttribute('href');
    const classBinding=new b.ClassBinding(classes);classBinding.update({static:false,dynamic:true});classBinding.update({dynamic:false});const className=classes.className;
    const showFirst=b.setShow(show,false);const showNoop=b.setShow(show,false);const hidden=show.hasAttribute('hidden');b.setShow(show,true);
    let forbidden='';try{b.setAttribute(link,'style','color:red');}catch(e){forbidden=(e as any).code;}
    return {literal,objectCode,value:(input as HTMLInputElement).value,checked:(input as HTMLInputElement).checked,aria,unsafe,href,className,showFirst,showNoop,hidden,shown:!show.hasAttribute('hidden'),forbidden};});
  expect(result).toEqual({literal:'&lt;script&gt;alert(1)&lt;/script&gt;',objectCode:'EXPRESSION_TYPE',value:'A',checked:true,aria:'false',unsafe:'URL_POLICY',href:null,className:'static',showFirst:true,showNoop:false,hidden:true,shown:true,forbidden:'DIRECTIVE_VALUE'});
});
