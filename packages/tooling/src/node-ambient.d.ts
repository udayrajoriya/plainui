declare module 'node:fs/promises' {
  export function readFile(path:string,encoding:'utf8'):Promise<string>;
}
declare module 'node:path' {
  export function dirname(path:string):string;
  export function isAbsolute(path:string):boolean;
  export function relative(from:string,to:string):string;
  export function resolve(...paths:string[]):string;
}
declare const process:{cwd():string};
