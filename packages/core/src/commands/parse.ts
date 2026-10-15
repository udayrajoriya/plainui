import {IDENTIFIER} from '../../../schema/src/allowlists.js';
import {PlainUIError} from '../diagnostics/codes.js';
import {parseExpression} from '../expression/parse.js';
import type {AstNode} from '../expression/ast.js';
import {parsePath,type ParsedPath} from '../state/path.js';

const effects=new Set(['set','toggle','emit','focus','refresh','reset','navigate','open','close','toast']);
export interface CompiledCommand {readonly name:string;readonly writePath?:ParsedPath;readonly arguments:readonly AstNode[]}
function fail():never {throw new PlainUIError('DIRECTIVE_VALUE');}
function splitTopLevel(source:string,separator:string):string[] {const parts:string[]=[];const stack:string[]=[];let quote='';let escaped=false;let start=0;
  for(let index=0;index<source.length;index++){const char=source[index]!;if(quote){if(escaped){escaped=false;continue;}if(char==='\\'){escaped=true;continue;}if(char===quote)quote='';continue;}if(char==='"'||char==="'"){quote=char;continue;}
    if('([{'.includes(char)){stack.push(char);continue;}if(')]}'.includes(char)){const open=stack.pop();if(!open||'([{'.indexOf(open)!==')]}'.indexOf(char))fail();continue;}
    if(char===separator&&stack.length===0){parts.push(source.slice(start,index).trim());start=index+1;}
  }
  if(quote||stack.length)fail();parts.push(source.slice(start).trim());return parts;
}
function hasNestedEffect(ast:AstNode,names:ReadonlySet<string>):boolean {switch(ast.kind){case 'call':return names.has(ast.name)||ast.arguments.some(item=>hasNestedEffect(item,names));case 'array':return ast.items.some(item=>hasNestedEffect(item,names));case 'object':return ast.entries.some(item=>hasNestedEffect(item.value,names));case 'group':case 'unary':return hasNestedEffect(ast.value,names);case 'binary':return hasNestedEffect(ast.left,names)||hasNestedEffect(ast.right,names);case 'ternary':return hasNestedEffect(ast.condition,names)||hasNestedEffect(ast.yes,names)||hasNestedEffect(ast.no,names);case 'member':return hasNestedEffect(ast.target,names);case 'index':return hasNestedEffect(ast.target,names)||hasNestedEffect(ast.key,names);default:return false;}}
export function parseCommands(source:string,customEffects:ReadonlySet<string>=new Set()):readonly CompiledCommand[] {const segments=splitTopLevel(source,';');if(segments.at(-1)==='')segments.pop();if(!segments.length||segments.some(part=>!part))fail();const forbidden=new Set([...effects,...customEffects]);
  return segments.map(segment=>{const match=/^([A-Za-z_$][A-Za-z0-9_$]*)\s*\(([\s\S]*)\)$/.exec(segment);if(!match||!IDENTIFIER.test(match[1]!))return fail();const name=match[1]!;const body=match[2]!.trim();const raw=body?splitTopLevel(body,','):[];if(raw.some(arg=>!arg))fail();let writePath:ParsedPath|undefined;
    if(name==='set'||name==='toggle'){if(raw.length!==(name==='set'?2:1))fail();try{writePath=parsePath(raw.shift()!);}catch{return fail();}}
    const args=raw.map(argument=>{let ast:AstNode;try{ast=parseExpression(argument);}catch{return fail();}if(hasNestedEffect(ast,forbidden))fail();return ast;});return {name,...(writePath?{writePath}:{}),arguments:args};
  });
}
