import type {JsonValue} from '../json/normalize.js';
import {IntlCache} from './intl-cache.js';
export type BuiltinName='len'|'json'|'number'|'currency'|'date';
export class FormatterInputError extends Error {}
const bad=():never=>{throw new FormatterInputError('Invalid formatter input');};
const calendar=(year:number,month:number,day:number):boolean=>{
  if(year<1||month<1||month>12||day<1)return false;
  const leap=year%4===0&&(year%100!==0||year%400===0);
  const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];return day<=days[month-1]!;
};
function dateValue(input:JsonValue,zone:string,locale:string,cache:IntlCache):string {
  if(typeof input==='number'){const date=new Date(input);if(!Number.isFinite(date.getTime()))return bad();return cache.getDate(locale,zone).format(date);}
  if(typeof input!=='string')return bad();
  const only=/^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if(only){const year=Number(only[1]),month=Number(only[2]),day=Number(only[3]);if(!calendar(year,month,day))return bad();const date=new Date(0);date.setUTCFullYear(year,month-1,day);date.setUTCHours(0,0,0,0);return cache.getDate(locale,'UTC').format(date);}
  const stamp=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(input);
  if(!stamp||!calendar(Number(stamp[1]),Number(stamp[2]),Number(stamp[3]))||Number(stamp[4])>23||Number(stamp[5])>59||Number(stamp[6])>59)return bad();
  const offset=stamp[7]!;if(offset!=='Z'&&(Number(offset.slice(1,3))>23||Number(offset.slice(4))>59))return bad();
  const date=new Date(input);if(!Number.isFinite(date.getTime()))return bad();return cache.getDate(locale,zone).format(date);
}
export function callBuiltin(name:BuiltinName,args:readonly JsonValue[],options:{locale:string;timeZone:string},cache:IntlCache):JsonValue {
  if(name==='len'){if(args.length!==1)return bad();const value=args[0];if(typeof value==='string')return value.length;if(Array.isArray(value))return value.length;if(value&&typeof value==='object')return Object.keys(value).length;return bad();}
  if(name==='json'){if(args.length!==1)return bad();return JSON.stringify(args[0]);}
  if(name==='number'){if(args.length!==1||typeof args[0]!=='number'||!Number.isFinite(args[0]))return bad();return cache.getNumber(options.locale).format(args[0]);}
  if(name==='currency'){if(args.length!==2||typeof args[0]!=='number'||!Number.isFinite(args[0])||typeof args[1]!=='string'||!/^[A-Z]{3}$/.test(args[1]))return bad();try{return cache.getNumber(options.locale,args[1]).format(args[0]);}catch{return bad();}}
  if(name==='date'){if(args.length!==1)return bad();return dateValue(args[0]!,options.timeZone,options.locale,cache);}
  return bad();
}
