import { FORBIDDEN_KEYS,IDENTIFIER } from '../../../schema/src/allowlists.js';
import { PlainUIError } from '../diagnostics/codes.js';
import { normalizeJson,type JsonValue } from '../json/normalize.js';
export type PathSegment={kind:'property'|'index';value:string|number;span:{start:number;end:number}};
export type ParsedPath={source:string;root:string;segments:readonly PathSegment[]};
export type WritableCell={value:JsonValue;writable:boolean};
const fail=():never=>{throw new PlainUIError('PATH_INVALID');};
export function parsePath(source:string,options:{writable?:boolean}={}):ParsedPath {
  const reserved=(key:string):void=>{if(FORBIDDEN_KEYS.has(key)||(options.writable!==false && key==='length'))fail();};
  let position=0;const segments:PathSegment[]=[];
  const identifier=():string=>{const match=/^[A-Za-z_$][A-Za-z0-9_$]*/.exec(source.slice(position));if(!match)throw new PlainUIError('PATH_INVALID');position+=match[0].length;reserved(match[0]);return match[0];};
  const root=identifier();
  while(position<source.length){
    const start=position;
    if(source[position]==='.') {position++;const name=identifier();segments.push({kind:'property',value:name,span:{start,end:position}});continue;}
    if(source[position]!=='[')fail();position++;
    if(source[position]==='"'||source[position]==="'"){
      const quote=source[position++]!;let decoded='';let closed=false;
      while(position<source.length){const char=source[position++]!;if(char===quote){closed=true;break;}if(char==='\\'){
        const escaped=source[position++];if(escaped===undefined)throw new PlainUIError('PATH_INVALID');
        if(escaped==='u'){const hex=source.slice(position,position+4);if(!/^[0-9a-fA-F]{4}$/.test(hex))fail();decoded+=String.fromCharCode(Number.parseInt(hex,16));position+=4;}
        else {const mapped:Record<string,string>={'"':'"',"'":"'",'\\':'\\','/':'/','b':'\b','f':'\f','n':'\n','r':'\r','t':'\t'};if(!Object.hasOwn(mapped,escaped))fail();decoded+=mapped[escaped]!;}
      }else {if(char==='\n'||char==='\r')fail();decoded+=char;}}
      if(!closed||source[position++]!==']')fail();reserved(decoded);segments.push({kind:'property',value:decoded,span:{start,end:position}});continue;
    }
    const match=/^(0|[1-9][0-9]*)/.exec(source.slice(position));if(!match)throw new PlainUIError('PATH_INVALID');position+=match[0].length;if(source[position++]!==']')fail();const index=Number(match[0]);if(!Number.isSafeInteger(index))fail();segments.push({kind:'index',value:index,span:{start,end:position}});
  }
  return {source,root,segments};
}
export function readPath(bindings:ReadonlyMap<string,WritableCell>,path:ParsedPath):JsonValue {
  const cell=bindings.get(path.root);if(!cell)throw new PlainUIError('PATH_INVALID');let value:JsonValue=cell.value;
  for(const segment of path.segments){if(value===null)return null;
    if(segment.kind==='index'){if(!Array.isArray(value))throw new PlainUIError('PATH_INVALID');value=value[segment.value as number]??null;}
    else if(Array.isArray(value)){if(segment.value==='length')return value.length;if(!Object.hasOwn(value,segment.value))return null;value=(value as unknown as Record<string,JsonValue>)[segment.value as string]??null;}
    else if(typeof value==='object'){value=Object.hasOwn(value,segment.value)?(value as Record<string,JsonValue>)[segment.value as string]!:null;}
    else return null;
  }
  return value;
}
export function replaceWritablePath(cell:WritableCell,path:ParsedPath,input:unknown):{value:JsonValue;changedPrefixes:readonly string[]} {
  if(!cell.writable)throw new PlainUIError('STATE_READONLY');
  const replacement=normalizeJson(input);
  if(!path.segments.length)return {value:replacement,changedPrefixes:[path.root]};
  const containers:Array<JsonValue[]|Record<string,JsonValue>>=[];let current:JsonValue=cell.value;
  for(let i=0;i<path.segments.length;i++){
    const segment=path.segments[i]!;const last=i===path.segments.length-1;
    if(segment.kind==='index'){
      if(!Array.isArray(current)||segment.value as number>=current.length)throw new PlainUIError('PATH_INVALID');
      containers.push(current);current=current[segment.value as number]!;
    } else {
      if(current===null||typeof current!=='object'||Array.isArray(current))throw new PlainUIError('PATH_INVALID');
      if(!last&&!Object.hasOwn(current,segment.value))fail();
      containers.push(current);current=(current as Record<string,JsonValue>)[segment.value as string]??null;
    }
  }
  let next=replacement;
  for(let i=path.segments.length-1;i>=0;i--){const container=containers[i]!;const segment=path.segments[i]!;if(Array.isArray(container)){const copy=container.slice();copy[segment.value as number]=next;next=copy;}else{const copy=Object.assign(Object.create(null),container) as Record<string,JsonValue>;copy[segment.value as string]=next;next=copy;}}
  const prefixes=[path.root];let prefix=path.root;for(const segment of path.segments){prefix+=segment.kind==='index'?`[${segment.value}]`:IDENTIFIER.test(segment.value as string)?`.${segment.value}`:`[${JSON.stringify(segment.value)}]`;prefixes.push(prefix);}
  return {value:next,changedPrefixes:prefixes};
}
