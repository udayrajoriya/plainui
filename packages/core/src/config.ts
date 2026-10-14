import { CONFIG_SCHEMA, validateSchema } from '../../schema/src/options.js';
import { PlainUIError } from './diagnostics/codes.js';

export interface ResolvedOptions {
  readonly api:{readonly baseUrl:string;readonly headers:Readonly<Record<string,string>>;readonly credentials:'omit'|'same-origin'|'include';readonly timeoutMs:number;readonly adapter:string;readonly allowedOrigins:readonly string[]};
  readonly cache:{readonly maxEntries:number};readonly locale:string;readonly timeZone:string;readonly persistence:{readonly version:number};readonly router:{readonly mode:'history'|'hash';readonly basePath:string};readonly security:{readonly csrf:null|{readonly header:string;readonly meta:string}};readonly fragments:{readonly enhance:boolean};readonly debug:boolean;
}
type JsonRecord=Record<string,unknown>;
const headerName=(value:string):boolean=>value.length>0 && [...value].every(char=>char.charCodeAt(0)===96 || char.charCodeAt(0)===39 || /^[!#$%&*+.^_|~0-9A-Za-z-]$/.test(char));
function fail():never { throw new PlainUIError('CONFIG_INVALID'); }
function plainRecord(value:unknown):value is JsonRecord { return typeof value==='object' && value!==null && !Array.isArray(value) && (Object.getPrototypeOf(value)===Object.prototype || Object.getPrototypeOf(value)===null); }
function copy(value:unknown):unknown {
  if(Array.isArray(value))return value.map(copy);
  if(!plainRecord(value))return value;
  const result:JsonRecord=Object.create(null);
  for(const [key,descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) { if(!('value' in descriptor))fail();result[key]=copy(descriptor.value); }
  return result;
}
function merge(base:JsonRecord,patch:JsonRecord):void {
  for(const [key,value] of Object.entries(patch)) {
    if(key==='headers' && plainRecord(base[key]) && plainRecord(value)) {
      const combined:JsonRecord=Object.create(null);
      for(const [name,entry] of Object.entries(base[key]))combined[name.toLowerCase()]=entry;
      for(const [name,entry] of Object.entries(value))combined[name.toLowerCase()]=entry;
      base[key]=combined;
    } else if(plainRecord(value) && plainRecord(base[key]))merge(base[key],value);
    else base[key]=copy(value);
  }
}
function freezeDeep<T>(value:T):T { if(value && typeof value==='object'){for(const child of Object.values(value))freezeDeep(child);Object.freeze(value);}return value; }
function validatePartial(input:unknown):JsonRecord { if(!plainRecord(input)||validateSchema(input,CONFIG_SCHEMA).length)fail();return copy(input) as JsonRecord; }
function configBlock(root:Element):JsonRecord {
  const name=root.getAttribute('ui-config');const alias=root.getAttribute('data-ui-config');
  if(name!==null && alias!==null)fail();
  const id=name??alias;
  if(id===null)return Object.create(null);
  if(!id.trim())fail();
  const matches=[...root.ownerDocument.querySelectorAll('[id]')].filter(element=>element.id===id);
  if(matches.length!==1 || matches[0]!.localName!=='script' || matches[0]!.getAttribute('type')!=='application/json')fail();
  try { return validatePartial(JSON.parse(matches[0]!.textContent??'')); } catch { return fail(); }
}
export function resolveConfiguration(root:Element,programmatic:unknown={}):ResolvedOptions {
  const document=root.ownerDocument;
  const origin=new URL(document.baseURI).origin;
  const defaults:JsonRecord={api:{baseUrl:`${origin}/`,headers:{},credentials:'same-origin',timeoutMs:30000,adapter:'identity',allowedOrigins:[origin]},cache:{maxEntries:100},locale:'en-US',timeZone:'UTC',persistence:{version:1},router:{mode:'history',basePath:'/'},security:{csrf:null},fragments:{enhance:false},debug:false};
  merge(defaults,configBlock(root));merge(defaults,validatePartial(programmatic));
  const options=defaults as unknown as ResolvedOptions;
  let base:URL;
  try { base=new URL(options.api.baseUrl,document.baseURI); } catch { return fail(); }
  if(!['http:','https:'].includes(base.protocol)||base.username||base.password)fail();
  (defaults.api as JsonRecord).baseUrl=base.href;
  const headers:Record<string,string>=Object.create(null);
  for(const [name,value] of Object.entries(options.api.headers)) { if(!headerName(name)||/[\r\n\0]/.test(value))fail();headers[name.toLowerCase()]=value; }
  (defaults.api as JsonRecord).headers=headers;
  const origins:string[]=[];
  for(const value of options.api.allowedOrigins) {
    let url:URL;try{url=new URL(value);}catch{return fail();}
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash||url.href!==`${url.origin}/`)fail();
    if(!origins.includes(url.origin))origins.push(url.origin);
  }
  (defaults.api as JsonRecord).allowedOrigins=origins;
  try { const locales=Intl.getCanonicalLocales(options.locale);if(locales.length!==1)fail();(defaults as JsonRecord).locale=locales[0]!;new Intl.DateTimeFormat('en-US',{timeZone:options.timeZone}); } catch { return fail(); }
  if(!options.router.basePath.startsWith('/')||options.router.basePath.includes('?')||options.router.basePath.includes('#')||options.router.basePath.includes('\\'))fail();
  if(options.security.csrf && (!headerName(options.security.csrf.header)||!options.security.csrf.meta.trim()))fail();
  return freezeDeep(defaults) as unknown as ResolvedOptions;
}
