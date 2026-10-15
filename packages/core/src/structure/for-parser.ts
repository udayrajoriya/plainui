import {IDENTIFIER,FORBIDDEN_KEYS} from '../../../schema/src/allowlists.js';
import {PlainUIError} from '../diagnostics/codes.js';
import {parseExpression} from '../expression/parse.js';
export interface ForSpec {readonly item:string;readonly index:string|null;readonly expression:string}
export function parseFor(source:string):ForSpec {const match=/^\s*([A-Za-z_$][A-Za-z0-9_$]*)(?:\s*,\s*([A-Za-z_$][A-Za-z0-9_$]*))?\s+in\s+([\s\S]+?)\s*$/.exec(source);if(!match)throw new PlainUIError('LOOP_INVALID');const item=match[1]!,index=match[2]??null,expression=match[3]!;if(!IDENTIFIER.test(item)||FORBIDDEN_KEYS.has(item)||index&&(!IDENTIFIER.test(index)||FORBIDDEN_KEYS.has(index)||index===item)||['store','route','props','$event'].includes(item)||index&&['store','route','props','$event'].includes(index))throw new PlainUIError('LOOP_INVALID');try{parseExpression(expression);}catch{throw new PlainUIError('LOOP_INVALID');}return {item,index,expression};}
