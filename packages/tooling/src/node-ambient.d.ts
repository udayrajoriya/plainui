declare module 'node:fs/promises' {
  export function readFile(path:string,encoding:'utf8'):Promise<string>;
  export function writeFile(path:string,data:string):Promise<void>;
  export function mkdir(path:string,options:{recursive:true}):Promise<string|undefined>;
  export function copyFile(source:string,destination:string):Promise<void>;
  export function rename(source:string,destination:string):Promise<void>;
  export function unlink(path:string):Promise<void>;
  export function rm(path:string,options:{recursive:true;force:true}):Promise<void>;
  export function stat(path:string):Promise<{isFile():boolean;isDirectory():boolean}>;
  export function readdir(path:string,options:{withFileTypes:true}):Promise<Array<{name:string;isFile():boolean;isDirectory():boolean}>>;
}
declare module 'node:path' {
  export const sep:string;
  export function basename(path:string):string;
  export function dirname(path:string):string;
  export function extname(path:string):string;
  export function isAbsolute(path:string):boolean;
  export function join(...paths:string[]):string;
  export function relative(from:string,to:string):string;
  export function resolve(...paths:string[]):string;
}
declare module 'node:crypto' {export function randomUUID():string;}
declare const process:{cwd():string;argv:string[];exitCode?:number;stdout:{write(text:string):void};stderr:{write(text:string):void}};
