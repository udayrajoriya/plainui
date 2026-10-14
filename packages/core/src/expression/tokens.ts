export type Span={start:number;end:number};
export type TokenKind='number'|'string'|'identifier'|'punctuation'|'eof';
export type Token={kind:TokenKind;text:string;value?:string|number;span:Span};
export class ExpressionError extends Error {
  readonly code:'EXPRESSION_PARSE'|'EXPRESSION_LIMIT';readonly span:Span;
  constructor(code:'EXPRESSION_PARSE'|'EXPRESSION_LIMIT',span:Span){super(code==='EXPRESSION_LIMIT'?'Expression limit exceeded.':'Expression syntax is invalid.');this.name='ExpressionError';this.code=code;this.span=span;}
}
