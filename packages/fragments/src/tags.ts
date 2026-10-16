import {FRAGMENT_DROP_SUBTREES,FRAGMENT_TAGS} from '../../schema/src/allowlists.js';
export const ALLOWED_FRAGMENT_TAGS=Object.freeze(new Set(FRAGMENT_TAGS));
export const DROPPED_FRAGMENT_SUBTREES=Object.freeze(new Set([...FRAGMENT_DROP_SUBTREES,'noscript']));
export const REMOVED_METADATA_TAGS=Object.freeze(new Set(['base','link','meta','title']));
export function allowedFragmentTag(name:string,enhanced:boolean,components:ReadonlySet<string>):boolean {return ALLOWED_FRAGMENT_TAGS.has(name)||enhanced&&name==='template'||enhanced&&components.has(name);}
