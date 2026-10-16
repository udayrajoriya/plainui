import {relative,sep} from 'node:path';
import type {ValidationDiagnostic} from './validate.js';
export interface ValidationSummary {readonly errors:number;readonly warnings:number}
export function summarize(diagnostics:readonly ValidationDiagnostic[]):ValidationSummary{return {errors:diagnostics.filter(item=>item.severity==='error').length,warnings:diagnostics.filter(item=>item.severity==='warning').length};}
export function displayPath(root:string,file:string):string{return relative(root,file).split(sep).join('/')||'.';}
export function textDiagnostics(root:string,diagnostics:readonly ValidationDiagnostic[]):string{return diagnostics.map(item=>`${displayPath(root,item.file)}:${item.line}:${item.column} ${item.severity} ${item.code} ${item.message}`).join('\n');}
