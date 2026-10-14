import type {Span} from './tokens.js';
export type AstBase={span:Span;depth:number};
export type AstNode=
  | (AstBase&{kind:'literal';value:null|boolean|string|number})
  | (AstBase&{kind:'identifier';name:string})
  | (AstBase&{kind:'array';items:AstNode[]})
  | (AstBase&{kind:'object';entries:Array<{key:string;value:AstNode}>})
  | (AstBase&{kind:'group';value:AstNode})
  | (AstBase&{kind:'unary';operator:'!'|'-';value:AstNode})
  | (AstBase&{kind:'binary';operator:string;left:AstNode;right:AstNode})
  | (AstBase&{kind:'ternary';condition:AstNode;yes:AstNode;no:AstNode})
  | (AstBase&{kind:'member';target:AstNode;key:string})
  | (AstBase&{kind:'index';target:AstNode;key:AstNode})
  | (AstBase&{kind:'call';name:string;arguments:AstNode[]});
