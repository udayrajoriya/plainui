import { expect, test } from 'vitest';
import { resolveConfiguration } from '../../packages/core/src/config.js';
import { DiagnosticBus } from '../../packages/core/src/diagnostics/emit.js';
import { Inspector } from '../../packages/core/src/diagnostics/inspector.js';
import { safeUrlLocation } from '../../packages/core/src/diagnostics/redact.js';

function root(block?:{id:string;type:string;text:string},reference?:string):Element {
  const script=block?{id:block.id,localName:'script',getAttribute:(name:string)=>name==='type'?block.type:null,textContent:block.text}:undefined;
  const doc={baseURI:'https://example.test/page',querySelectorAll:()=>script?[script]:[]};
  return {ownerDocument:doc,getAttribute:(name:string)=>name==='ui-config'?(reference??null):null} as unknown as Element;
}
test('config.precedence: defaults, block, programmatic and case-insensitive headers',()=>{
  const options=resolveConfiguration(root({id:'cfg',type:'application/json',text:JSON.stringify({api:{timeoutMs:50,headers:{Accept:'one','X-Mode':'block'}},locale:'fr-FR'})},'cfg'),{api:{timeoutMs:75,headers:{accept:'two'}},debug:true});
  expect(options.api.timeoutMs).toBe(75);expect(options.api.headers).toEqual({'accept':'two','x-mode':'block'});expect(options.locale).toBe('fr-FR');expect(options.api.baseUrl).toBe('https://example.test/');expect(Object.isFrozen(options.api.headers)).toBe(true);
});
test('config.unknown-nested and config.bad-json fail locally',()=>{
  expect(()=>resolveConfiguration(root(),{api:{unexpected:1}})).toThrow('Configuration is invalid.');
  expect(()=>resolveConfiguration(root({id:'x',type:'application/json',text:'{'},'x'))).toThrow('Configuration is invalid.');
  expect(()=>resolveConfiguration(root({id:'x',type:'text/javascript',text:'{}'},'x'))).toThrow('Configuration is invalid.');
});
test('config.locale-zone and origin validation',()=>{
  expect(()=>resolveConfiguration(root(),{timeZone:'Not/A_Zone'})).toThrow();
  expect(()=>resolveConfiguration(root(),{locale:'not a locale'})).toThrow();
  expect(()=>resolveConfiguration(root(),{api:{allowedOrigins:['https://example.test/path']}})).toThrow();
  expect(resolveConfiguration(root(),{api:{allowedOrigins:['https://example.test/','https://example.test/']}}).api.allowedOrigins).toEqual(['https://example.test']);
});
test('diagnostic.redaction and diagnostic.listener-throws',()=>{
  const bus=new DiagnosticBus('root-1',true);const received:string[]=[];
  bus.subscribe(()=>{throw new Error('logger failed');});const cancel=bus.subscribe(d=>received.push(d.code));
  const diagnostic=bus.emit('REQUEST_INVALID',{directive:'ui-get',location:'root/a?token=secret',span:{start:1,end:3},correlationId:'req_1'});
  expect(diagnostic.location).toBe('root/a');expect(JSON.stringify(diagnostic)).not.toContain('secret');expect(received).toEqual(['REQUEST_INVALID']);cancel();cancel();bus.emit('CONFIG_INVALID');expect(received).toHaveLength(1);
  expect(safeUrlLocation('https://user:password@example.test/path?token=secret#x')).toBe('https://example.test');
  expect(new DiagnosticBus('root-1',false).emit('EXPRESSION_PARSE',{span:{start:0,end:2}}).span).toBeUndefined();
});
test('inspector.disabled and inspector.zero',()=>{
  expect(()=>new Inspector(false).snapshot()).toThrow('Inspector is disabled.');
  const inspector=new Inspector(true);const release=inspector.allocate('listeners');expect(inspector.snapshot().listeners).toBe(1);expect(inspector.zero()).toBe(false);release();release();expect(inspector.zero()).toBe(true);expect(inspector.snapshot().listeners).toBe(0);
});
