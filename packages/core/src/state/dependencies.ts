import type {ParsedPath} from './path.js';

export type DependencyKind='value'|'whole'|'length'|'iteration';
export interface Dependency {readonly cell:object;readonly path:string;readonly kind:DependencyKind}
export function pathKey(path:ParsedPath):string {return path.root+path.segments.map(segment=>typeof segment.value==='number'?`[${segment.value}]`:`[${JSON.stringify(segment.value)}]`).join('');}
export function affects(read:Dependency,cell:object,writePath:string):boolean {
  if(read.cell!==cell)return false;
  const ancestor=(left:string,right:string)=>right===left||right.startsWith(left+'[');
  if(read.kind==='value')return ancestor(writePath,read.path);
  if(read.kind==='whole')return ancestor(writePath,read.path)||ancestor(read.path,writePath);
  if(read.kind==='length')return ancestor(writePath,read.path);
  return ancestor(writePath,read.path)||ancestor(read.path,writePath);
}
