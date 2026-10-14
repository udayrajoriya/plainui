import {ExpressionError,type Token} from './tokens.js';
const whitespace=new Set([' ','\t','\r','\n']);
const digit=(char:string|undefined):boolean=>char!==undefined&&char>='0'&&char<='9';
const startIdentifier=(char:string|undefined):boolean=>char!==undefined&&/[A-Za-z_$]/.test(char);
const partIdentifier=(char:string|undefined):boolean=>char!==undefined&&/[A-Za-z0-9_$]/.test(char);
export function tokenize(source:string):Token[] {
  if(new TextEncoder().encode(source).length>16384)throw new ExpressionError('EXPRESSION_LIMIT',{start:0,end:source.length});
  const tokens:Token[]=[];let i=0;
  while(i<source.length){
    if(whitespace.has(source[i]!)){i++;continue;}
    const start=i;const char=source[i]!;
    if(startIdentifier(char)){i++;while(partIdentifier(source[i]))i++;tokens.push({kind:'identifier',text:source.slice(start,i),span:{start,end:i}});continue;}
    if(digit(char)||char==='.'&&digit(source[i+1])){
      if(char==='.'){i++;while(digit(source[i]))i++;}
      else {if(char==='0'&&digit(source[i+1]))throw new ExpressionError('EXPRESSION_PARSE',{start,end:i+2});while(digit(source[i]))i++;if(source[i]==='.'&&digit(source[i+1])){i++;while(digit(source[i]))i++;}else if(source[i]==='.')throw new ExpressionError('EXPRESSION_PARSE',{start,end:i+1});}
      if(source[i]==='e'||source[i]==='E'){i++;if(source[i]==='+'||source[i]==='-')i++;if(!digit(source[i]))throw new ExpressionError('EXPRESSION_PARSE',{start,end:i});while(digit(source[i]))i++;}
      const text=source.slice(start,i);const value=Number(text);if(!Number.isFinite(value))throw new ExpressionError('EXPRESSION_PARSE',{start,end:i});tokens.push({kind:'number',text,value,span:{start,end:i}});continue;
    }
    if(char==='"'||char==="'"){
      i++;let value='';let closed=false;
      while(i<source.length){const current=source[i++]!;if(current===char){closed=true;break;}if(current.charCodeAt(0)<32)throw new ExpressionError('EXPRESSION_PARSE',{start,end:i});
        if(current!=='\\'){value+=current;continue;}
        const escaped=source[i++];if(escaped===undefined)throw new ExpressionError('EXPRESSION_PARSE',{start,end:i});
        if(escaped==='u'){const hex=source.slice(i,i+4);if(!/^[0-9a-fA-F]{4}$/.test(hex))throw new ExpressionError('EXPRESSION_PARSE',{start,end:i+4});value+=String.fromCharCode(Number.parseInt(hex,16));i+=4;}
        else {const mapped:Record<string,string>={'"':'"',"'":"'",'\\':'\\','/':'/','b':'\b','f':'\f','n':'\n','r':'\r','t':'\t'};if(!Object.hasOwn(mapped,escaped)||escaped==="'"&&char==='"')throw new ExpressionError('EXPRESSION_PARSE',{start,end:i});value+=mapped[escaped]!;}
      }
      if(!closed)throw new ExpressionError('EXPRESSION_PARSE',{start,end:i});tokens.push({kind:'string',text:source.slice(start,i),value,span:{start,end:i}});continue;
    }
    const operator=['===','!==','&&','||','??','<=','>='].find(item=>source.startsWith(item,i));
    if(operator){i+=operator.length;tokens.push({kind:'punctuation',text:operator,span:{start,end:i}});continue;}
    if('+-*/%<>=!?:.,()[]{}'.includes(char)){i++;tokens.push({kind:'punctuation',text:char,span:{start,end:i}});continue;}
    throw new ExpressionError('EXPRESSION_PARSE',{start,end:i+1});
  }
  tokens.push({kind:'eof',text:'',span:{start:i,end:i}});return tokens;
}
