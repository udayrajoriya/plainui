import {normalizeJson,type JsonValue} from '../json/normalize.js';
import type {ScopeCell,BindingSource} from '../scope/scope.js';
export function createCell(source:BindingSource,input:unknown):ScopeCell {return {value:normalizeJson(input),version:0,writable:source==='state'||source==='store',source};}
export function publishCell(cell:ScopeCell,value:JsonValue):boolean {if(Object.is(cell.value,value))return false;cell.value=value;cell.version++;return true;}
