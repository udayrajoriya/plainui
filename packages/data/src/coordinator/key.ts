import {sha256} from '@noble/hashes/sha2.js';
import {materializeRequest,type FinalRequestDraft} from '../request/draft.js';

const encoder=new TextEncoder();
/** Length prefixes are measured in UTF-8 bytes, so no field content can collide with a separator. */
export function canonicalSegments(fields:readonly string[]):string {return fields.map(field=>`${encoder.encode(field).length}:${field}`).join('');}
function hex(bytes:Uint8Array):string {return [...bytes].map(byte=>byte.toString(16).padStart(2,'0')).join('');}
function normalizeValue(value:string):string {return value.replace(/[\t\r\n ]+/gu,' ').trim();}
export function canonicalHeaders(headers:Headers):string {return canonicalSegments([...headers.entries()].map(([name,value])=>[name.toLowerCase(),normalizeValue(value)] as const).sort(([a],[b])=>a.localeCompare(b,'en')).flatMap(([name,value])=>[name,value]));}
/** Browser secure contexts use Web Crypto; HTTP/local fallback uses the pinned noble implementation. */
export async function digestSha256(value:string,webCrypto:SubtleCrypto|undefined=globalThis.isSecureContext?globalThis.crypto?.subtle:undefined):Promise<string> {const bytes=encoder.encode(value);return hex(webCrypto?new Uint8Array(await webCrypto.digest('SHA-256',bytes)):sha256(bytes));}
export interface CacheKeyOptions {readonly rootId:string;readonly draft:FinalRequestDraft;readonly webCrypto?:SubtleCrypto}
export async function cacheKey(options:CacheKeyOptions):Promise<string> {const metadata=options.draft.metadata;const headers=materializeRequest(options.draft).headers;const digest=await digestSha256(canonicalHeaders(headers),options.webCrypto);const url=new URL(metadata.url);url.hash='';return canonicalSegments([options.rootId,String(metadata.epoch),metadata.adapter.name,metadata.adapter.version,metadata.method,url.href,metadata.credentials,digest]);}
export function flightKey(key:string,draft:FinalRequestDraft,invalidationGeneration:number,targetId=''):string {const {metadata}=draft;if(!Number.isSafeInteger(invalidationGeneration)||invalidationGeneration<0)throw new RangeError('Invalid invalidation generation.');return canonicalSegments([key,String(metadata.timeoutMs),String(metadata.retry),metadata.responseMode,String(invalidationGeneration),metadata.responseMode==='html'?targetId:'']);}
