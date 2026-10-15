import {expect,test} from 'vitest';
import {compileUrlTemplate,resolveUrlTemplate} from '../../packages/data/src/request/url-template.js';
import {applyQuery} from '../../packages/data/src/request/query.js';

const options={mode:'request' as const,apiBaseUrl:'https://api.test/v1/',documentUrl:'https://app.test/page',allowedOrigins:['https://api.test'],reader:{read:(name:string)=>({found:true,value:name==='id'?'a/b':name==='missing'?null:12})},evaluation:{locale:'en-US',timeZone:'UTC'}};
const resolve=(source:string)=>resolveUrlTemplate(compileUrlTemplate(source),options);
const href=(source:string)=>{const result=resolve(source);if(result.status!=='ready')throw new Error('Expected ready URL');return result.url.href;};
test('url.encoded-slash, null and relative base',()=>{
  expect(href('items/{id}')).toBe('https://api.test/v1/items/a%2Fb');
  expect(href('/items/{id}')).toBe('https://api.test/items/a%2Fb');
  expect(href('/items/{id}#section')).toBe('https://api.test/items/a%2Fb');
  expect(resolve('items/{missing}')).toEqual({status:'incomplete'});
});
test('url.query-replace keeps remaining order and repeated new values',()=>{
  const url=applyQuery(new URL('https://api.test/x?a=1&q=old&b=2&q=older'),{q:['a','b'],a:null,c:[null,3]});
  expect(url.search).toBe('?b=2&q=a&q=b&c=3');
  expect(()=>applyQuery(url,{q:[['nested']]})).toThrow();
});
test('url.authority, credentials, protocol and raw unmatched braces are rejected',()=>{
  for(const source of ['https://{id}/x','{id}://api.test/x','//{id}/x','https://user:pass@api.test/x','ftp://api.test/x','/x/{id'])expect(()=>resolve(source)).toThrow();
  expect(href('/x/%7Bvalue%7D')).toBe('https://api.test/x/%7Bvalue%7D');
  expect(()=>resolve('https://elsewhere.test/x')).toThrow();
});
test('url.template nested braces and quoted braces compile as one substitution',()=>{
  const template=compileUrlTemplate('/x/{json({"key":"}"})}');expect(template.segments).toHaveLength(2);
});
test('navigation resolves against document URL',()=>{
  const result=resolveUrlTemplate(compileUrlTemplate('other/{id}#part'),{...options,mode:'navigation',allowedOrigins:['https://app.test']});
  expect(result.status==='ready'?result.url.href:null).toBe('https://app.test/other/a%2Fb#part');
});
