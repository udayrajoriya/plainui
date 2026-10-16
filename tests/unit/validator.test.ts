import {mkdtemp,readFile,rm,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {afterEach,expect,test} from 'vitest';
import {validateFiles} from '../../packages/tooling/src/validate.js';
const roots:string[]=[];afterEach(async()=>{await Promise.all(roots.splice(0).map(root=>rm(root,{recursive:true,force:true})));});
async function project(files:Record<string,string>,manifest:any=null){const root=await mkdtemp(join(tmpdir(),'plainui-validator-'));roots.push(root);for(const [name,source] of Object.entries(files)){const file=join(root,name);await mkdir(join(file,'..'),{recursive:true});await writeFile(file,source);}return {root,result:await validateFiles([Object.keys(files)[0]!],{root,manifest})};}
const full={modules:['data','forms','components','router','fragments','ui'],registrations:{commands:['save'],formatters:[],behaviors:['widget'],adapters:[]}};

test('validate.runtime-parity',async()=>{const {result}=await project({'index.html':'<main ui-app="app"><template ui-if="("></template><button ui-on:click="set(count,)"></button></main>'},full);expect(result.diagnostics.map(item=>item.code)).toEqual(expect.arrayContaining(['EXPRESSION_PARSE','DIRECTIVE_VALUE']));});
test('validate.template-content',async()=>{const {result}=await project({'index.html':'<main ui-app="app"><template><span ui-unknown="x"></span></template></main>'},full);expect(result.diagnostics.some(item=>item.code==='UNKNOWN_DIRECTIVE'&&item.line===1)).toBe(true);});
test('validate.import-cycle',async()=>{const {result}=await project({'index.html':'<main ui-app="app"><template ui-import="a.html"></template></main>','a.html':'<template ui-import="index.html"></template>'},full);expect(result.diagnostics.map(item=>item.code)).toContain('COMPONENT_IMPORT_CYCLE');});
test('validate.dynamic-warning',async()=>{const {result}=await project({'index.html':'<main ui-app="app"><section ui-use="unknown"></section></main>'});expect(result.diagnostics.some(item=>item.code==='VALIDATION_DYNAMIC'&&item.severity==='warning')).toBe(true);});
test('validate.locations',async()=>{const {result}=await project({'index.html':'<main ui-app="app">\n  <span ui-nope="x"></span>\n</main>'},full);expect(result.diagnostics.find(item=>item.code==='UNKNOWN_DIRECTIVE')).toMatchObject({line:2,column:9});});
test('validate.no-network',async()=>{let calls=0;const original=globalThis.fetch;globalThis.fetch=(async()=>{calls++;throw new Error();}) as typeof fetch;try{const {result}=await project({'index.html':'<main ui-app="app"><template ui-import="https://example.test/x.html"></template></main>'},full);expect(calls).toBe(0);expect(result.diagnostics.map(item=>item.code)).toContain('COMPONENT_IMPORT');}finally{globalThis.fetch=original;}});
test('validate.no-mutation',async()=>{const source='<main ui-app="app"><span ui-text="name"></span></main>',{root}=await project({'index.html':source},full);expect(await readFile(join(root,'index.html'),'utf8')).toBe(source);});
