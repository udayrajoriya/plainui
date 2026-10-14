import { cloneJson } from './clone.js';
import type { JsonValue } from './normalize.js';
export function freezeJson<T extends JsonValue>(value:T):Readonly<T> {
  const seen=new WeakSet<object>();const stack:object[]=[];
  if(value && typeof value==='object')stack.push(value);
  while(stack.length){const item=stack.pop()!;if(seen.has(item))continue;seen.add(item);for(const child of Object.values(item))if(child && typeof child==='object')stack.push(child);Object.freeze(item);}
  return value as Readonly<T>;
}
export function detachedSnapshot(value:JsonValue):Readonly<JsonValue> { return freezeJson(cloneJson(value)); }
