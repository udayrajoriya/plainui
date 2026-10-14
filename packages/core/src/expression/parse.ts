import {FORBIDDEN_KEYS} from '../../../schema/src/allowlists.js';
import type {AstNode} from './ast.js';
import {PRECEDENCE,POSTFIX_PRECEDENCE,UNARY_PRECEDENCE} from './precedence.js';
import {tokenize} from './tokenize.js';
import {ExpressionError,type Span,type Token} from './tokens.js';
const maxDepth=128;
function node<T extends AstNode>(input:T):T { if(input.depth>maxDepth)throw new ExpressionError('EXPRESSION_LIMIT',input.span);return input; }
function depth(...children:AstNode[]):number {return 1+Math.max(0,...children.map(child=>child.depth));}
function ungrouped(node:AstNode,operators:readonly string[]):boolean {return node.kind==='binary'&&operators.includes(node.operator);}
class Parser {
  private position=0;private recursion=0;
  constructor(private readonly tokens:Token[]){}
  private current():Token {return this.tokens[this.position]!;}
  private take():Token {return this.tokens[this.position++]!;}
  private expect(text:string):Token {const token=this.current();if(token.text!==text)throw new ExpressionError('EXPRESSION_PARSE',token.span);return this.take();}
  private error(token=this.current()):never {throw new ExpressionError('EXPRESSION_PARSE',token.span);}
  parse():AstNode {const result=this.expression(0);if(this.current().kind!=='eof')this.error();return result;}
  private expression(minimum:number):AstNode {
    if(++this.recursion>256)throw new ExpressionError('EXPRESSION_LIMIT',this.current().span);
    try {
      let left=this.prefix();
      while(true){const token=this.current();
        if(POSTFIX_PRECEDENCE>=minimum && token.text==='.'){
          this.take();const key=this.take();if(key.kind!=='identifier'||FORBIDDEN_KEYS.has(key.text))this.error(key);
          left=node({kind:'member',target:left,key:key.text,span:{start:left.span.start,end:key.span.end},depth:depth(left)});continue;
        }
        if(POSTFIX_PRECEDENCE>=minimum && token.text==='['){this.take();const key=this.expression(0);const close=this.expect(']');left=node({kind:'index',target:left,key,span:{start:left.span.start,end:close.span.end},depth:depth(left,key)});continue;}
        if(POSTFIX_PRECEDENCE>=minimum && token.text==='('){if(left.kind!=='identifier')this.error(token);this.take();const args:AstNode[]=[];if(this.current().text!==')'){while(true){args.push(this.expression(0));if(this.current().text!==',')break;this.take();if(this.current().text===')')this.error();}}const close=this.expect(')');left=node({kind:'call',name:left.name,arguments:args,span:{start:left.span.start,end:close.span.end},depth:depth(...args)});continue;}
        if(token.text==='?'&&minimum<=0){this.take();const yes=this.expression(0);this.expect(':');const no=this.expression(0);left=node({kind:'ternary',condition:left,yes,no,span:{start:left.span.start,end:no.span.end},depth:depth(left,yes,no)});continue;}
        const precedence=PRECEDENCE[token.text];if(precedence===undefined||precedence<minimum)break;
        this.take();const right=this.expression(precedence+1);
        if(token.text==='??'&&(ungrouped(left,['&&','||'])||ungrouped(right,['&&','||']))||['&&','||'].includes(token.text)&&(ungrouped(left,['??'])||ungrouped(right,['??'])))this.error(token);
        left=node({kind:'binary',operator:token.text,left,right,span:{start:left.span.start,end:right.span.end},depth:depth(left,right)});
      }
      return left;
    }finally{this.recursion--;}
  }
  private prefix():AstNode {
    const token=this.take();const start=token.span.start;
    if(token.kind==='number'||token.kind==='string')return node({kind:'literal',value:token.value!,span:token.span,depth:1});
    if(token.kind==='identifier'){
      if(token.text==='null'||token.text==='true'||token.text==='false')return node({kind:'literal',value:token.text==='null'?null:token.text==='true',span:token.span,depth:1});
      if(['new','function','class','this','undefined','NaN','Infinity'].includes(token.text))this.error(token);
      return node({kind:'identifier',name:token.text,span:token.span,depth:1});
    }
    if(token.text==='!'||token.text==='-'){const value=this.expression(UNARY_PRECEDENCE);return node({kind:'unary',operator:token.text,value,span:{start,end:value.span.end},depth:depth(value)});}
    if(token.text==='('){const value=this.expression(0);const close=this.expect(')');return node({kind:'group',value,span:{start,end:close.span.end},depth:depth(value)});}
    if(token.text==='['){const items:AstNode[]=[];if(this.current().text!==']'){while(true){items.push(this.expression(0));if(this.current().text!==',')break;this.take();if(this.current().text===']')this.error();}}const close=this.expect(']');return node({kind:'array',items,span:{start,end:close.span.end},depth:depth(...items)});}
    if(token.text==='{'){const entries:Array<{key:string;value:AstNode}>=[];const keys=new Set<string>();if(this.current().text!=='}'){while(true){const key=this.take();if(key.kind!=='string'||typeof key.value!=='string'||FORBIDDEN_KEYS.has(key.value)||keys.has(key.value))this.error(key);keys.add(key.value);this.expect(':');entries.push({key:key.value,value:this.expression(0)});if(this.current().text!==',')break;this.take();if(this.current().text==='}')this.error();}}const close=this.expect('}');return node({kind:'object',entries,span:{start,end:close.span.end},depth:depth(...entries.map(entry=>entry.value))});}
    this.error(token);
  }
}
export function parseExpression(source:string):AstNode {return new Parser(tokenize(source)).parse();}
const CACHE_LIMIT=512;
const cache=new Map<string,AstNode|ExpressionError>();
function freezeAst(root:AstNode):AstNode {const stack:unknown[]=[root];while(stack.length){const item=stack.pop();if(!item||typeof item!=='object'||Object.isFrozen(item))continue;for(const value of Object.values(item))stack.push(value);Object.freeze(item);}return root;}
export function parseCached(source:string,mode='expression'):AstNode {
  const key=`1\0${mode}\0${source}`;const hit=cache.get(key);if(hit){cache.delete(key);cache.set(key,hit);if(hit instanceof ExpressionError)throw hit;return hit;}
  let result:AstNode|ExpressionError;try{result=freezeAst(parseExpression(source));}catch(error){if(!(error instanceof ExpressionError))throw error;result=Object.freeze(error);}
  cache.set(key,result);if(cache.size>CACHE_LIMIT)cache.delete(cache.keys().next().value!);
  if(result instanceof ExpressionError)throw result;return result;
}
export function parseCacheSize():number{return cache.size;}
