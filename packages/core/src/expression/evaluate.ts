import {FORBIDDEN_KEYS} from '../../../schema/src/allowlists.js';
import {normalizeJson,type JsonValue} from '../json/normalize.js';
import type {AstNode} from './ast.js';
import {callBuiltin,FormatterInputError,type BuiltinName} from './builtins.js';
import {IntlCache} from './intl-cache.js';
import type {Span} from './tokens.js';

export type EvaluationCode='EXPRESSION_TYPE'|'EXPRESSION_LIMIT'|'IDENTIFIER_UNKNOWN'|'FORMATTER_UNKNOWN';
export type EvaluationResult={ok:true;value:JsonValue;dependencies:readonly string[];missing:boolean;steps:number}|{ok:false;value:null;code:EvaluationCode;span:Span;dependencies:readonly string[];missing:boolean;steps:number};
export type LexicalReader={read(name:string):{found:boolean;value:JsonValue}};
export type CustomFormatter=(...args:readonly JsonValue[])=>unknown;
export class FormatterGuard {
  private active=0;
  run<T>(callback:()=>T):T {this.active++;try{return callback();}finally{this.active--;}}
  assertWritable():void {if(this.active)throw new Error('State writes are forbidden during formatter execution');}
}
export class EvaluationBudget {
  steps=0;
  constructor(readonly max=10000){}
  consume(span:Span):void {if(this.steps>=this.max)throw new EvaluationFailure('EXPRESSION_LIMIT',span);this.steps++;}
}
export type EvaluationOptions={locale:string;timeZone:string;formatters?:ReadonlyMap<string,CustomFormatter>;intlCache?:IntlCache;budget?:EvaluationBudget;guard?:FormatterGuard};
class EvaluationFailure extends Error {constructor(readonly code:EvaluationCode,readonly span:Span){super(code);}}
type Value={value:JsonValue;path?:string};
const builtinNames=new Set<BuiltinName>(['len','json','number','currency','date']);
export function truthy(value:JsonValue):boolean {return value!==null&&value!==false&&value!==0&&value!=='';}
export function evaluate(ast:AstNode,reader:LexicalReader,options:EvaluationOptions):EvaluationResult {
  const dependencies=new Set<string>();let missing=false;
  const budget=options.budget??new EvaluationBudget();const cache=options.intlCache??new IntlCache();const guard=options.guard??new FormatterGuard();
  const fail=(code:EvaluationCode,span:Span):never=>{throw new EvaluationFailure(code,span);};
  const consume=(item:Value):JsonValue=>{if(item.path)dependencies.add(item.path);return item.value;};
  const property=(target:Value,key:string|number,span:Span):Value=>{
    budget.consume(span);
    const text=String(key);if(FORBIDDEN_KEYS.has(text))fail('EXPRESSION_TYPE',span);
    const path=target.path?typeof key==='number'?`${target.path}[${key}]`:/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(text)?`${target.path}.${text}`:`${target.path}[${JSON.stringify(text)}]`:undefined;
    const value=target.value;
    if(value===null){missing=true;return {value:null,...(path?{path}:{})};}
    if(Array.isArray(value)){
      if(text==='length')return {value:value.length,...(path?{path}:{})};
      if(!/^(0|[1-9][0-9]*)$/.test(text)||!Number.isSafeInteger(Number(text))||!Object.hasOwn(value,text)){missing=true;return {value:null,...(path?{path}:{})};}
      return {value:value[Number(text)]!,...(path?{path}:{})};
    }
    if(typeof value==='object'){
      if(!Object.hasOwn(value,text)){missing=true;return {value:null,...(path?{path}:{})};}
      return {value:(value as Record<string,JsonValue>)[text]!,...(path?{path}:{})};
    }
    if(typeof value==='string'){missing=true;return {value:null,...(path?{path}:{})};}
    return fail('EXPRESSION_TYPE',span);
  };
  const compute=(node:AstNode):Value=>{
    budget.consume(node.span);
    switch(node.kind){
      case 'literal':return {value:node.value};
      case 'identifier':{const result=reader.read(node.name);if(!result.found)return fail('IDENTIFIER_UNKNOWN',node.span);return {value:result.value,path:node.name};}
      case 'group':return compute(node.value);
      case 'array':return {value:node.items.map(item=>consume(compute(item)))};
      case 'object':{const result:Record<string,JsonValue>=Object.create(null);for(const entry of node.entries)result[entry.key]=consume(compute(entry.value));return {value:result};}
      case 'member':return property(compute(node.target),node.key,node.span);
      case 'index':{const target=compute(node.target);const key=consume(compute(node.key));if(typeof key!=='string'&&!(typeof key==='number'&&Number.isSafeInteger(key)&&key>=0))return fail('EXPRESSION_TYPE',node.key.span);return property(target,key,node.span);}
      case 'unary':{const value=consume(compute(node.value));if(node.operator==='!')return {value:!truthy(value)};if(typeof value!=='number')return fail('EXPRESSION_TYPE',node.span);return {value:-value};}
      case 'binary':{
        const left=consume(compute(node.left));
        if(node.operator==='&&')return truthy(left)?{value:consume(compute(node.right))}:{value:left};
        if(node.operator==='||')return truthy(left)?{value:left}:{value:consume(compute(node.right))};
        if(node.operator==='??')return left===null?{value:consume(compute(node.right))}:{value:left};
        const right=consume(compute(node.right));
        if(node.operator==='===')return {value:left===right};if(node.operator==='!==')return {value:left!==right};
        if(['<','<=','>','>='].includes(node.operator)){
          if(typeof left!==typeof right || !['number','string'].includes(typeof left))return fail('EXPRESSION_TYPE',node.span);
          if(typeof left==='number'&&typeof right==='number')return {value:node.operator==='<'?left<right:node.operator==='<='?left<=right:node.operator==='>'?left>right:left>=right};
          const a=left as string,b=right as string;return {value:node.operator==='<'?a<b:node.operator==='<='?a<=b:node.operator==='>'?a>b:a>=b};
        }
        if(node.operator==='+'&&typeof left==='string'&&typeof right==='string')return {value:left+right};
        if(typeof left!=='number'||typeof right!=='number')return fail('EXPRESSION_TYPE',node.span);
        if((node.operator==='/'||node.operator==='%')&&right===0)return fail('EXPRESSION_TYPE',node.span);
        const value=node.operator==='+'?left+right:node.operator==='-'?left-right:node.operator==='*'?left*right:node.operator==='/'?left/right:left%right;
        if(!Number.isFinite(value))return fail('EXPRESSION_TYPE',node.span);return {value};
      }
      case 'ternary':return truthy(consume(compute(node.condition)))?compute(node.yes):compute(node.no);
      case 'call':{
        const known=builtinNames.has(node.name as BuiltinName)||options.formatters?.has(node.name);if(!known)return fail('FORMATTER_UNKNOWN',node.span);
        const args=node.arguments.map(argument=>consume(compute(argument)));
        try {
          if(builtinNames.has(node.name as BuiltinName))return {value:callBuiltin(node.name as BuiltinName,args,options,cache)};
          const output=guard.run(()=>options.formatters!.get(node.name)!(...args));
          if(output && typeof output==='object'&&'then' in output)return fail('EXPRESSION_TYPE',node.span);
          return {value:normalizeJson(output)};
        }catch(error){if(error instanceof EvaluationFailure)throw error;if(error instanceof FormatterInputError)return fail('EXPRESSION_TYPE',node.span);return fail('EXPRESSION_TYPE',node.span);}
      }
    }
  };
  try {const value=consume(compute(ast));return {ok:true,value,dependencies:[...dependencies],missing,steps:budget.steps};}
  catch(error){if(!(error instanceof EvaluationFailure))throw error;return {ok:false,value:null,code:error.code,span:error.span,dependencies:[...dependencies],missing,steps:budget.steps};}
}
