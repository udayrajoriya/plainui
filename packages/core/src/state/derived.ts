import {PlainUIError} from '../diagnostics/codes.js';
import type {JsonValue} from '../json/normalize.js';
import type {ScopeCell} from '../scope/scope.js';
import {publishCell} from './cell.js';

export type DerivedResult={ok:true;value:JsonValue}|{ok:false;code:'EXPRESSION_LIMIT'|'EXPRESSION_TYPE'};
type DerivedNode={name:string;cell:ScopeCell;dependencies:readonly string[];evaluate:()=>DerivedResult;disabled:boolean};
export class DerivedGraph {
  private nodes=new Map<string,DerivedNode>();
  constructor(private readonly onError:(error:unknown)=>void){}
  define(name:string,cell:ScopeCell,dependencies:readonly string[],evaluate:()=>DerivedResult):void {this.nodes.set(name,{name,cell,dependencies,evaluate,disabled:false});}
  evaluateAll():void {
    const visited=new Set<string>();const visiting:string[]=[];const cyclic=new Set<string>();
    const visit=(name:string):void=>{if(visited.has(name))return;const node=this.nodes.get(name);if(!node)return;
      const cycleStart=visiting.indexOf(name);if(cycleStart>=0){for(const member of visiting.slice(cycleStart))cyclic.add(member);return;}
      visiting.push(name);for(const dependency of node.dependencies)visit(dependency);visiting.pop();visited.add(name);
      if(cyclic.has(name)){if(!node.disabled)this.onError(new PlainUIError('DERIVED_CYCLE'));node.disabled=true;return;}
      node.disabled=false;try{const result=node.evaluate();if(result.ok)publishCell(node.cell,result.value);else if(result.code==='EXPRESSION_LIMIT')this.onError(new PlainUIError('EXPRESSION_LIMIT'));else {publishCell(node.cell,null);this.onError(new PlainUIError('EXPRESSION_TYPE'));}}
      catch(error){this.onError(error);}
    };
    for(const name of this.nodes.keys())visit(name);
  }
}
