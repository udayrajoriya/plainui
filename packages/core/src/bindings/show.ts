import {truthy} from '../expression/evaluate.js';
import type {JsonValue} from '../json/normalize.js';
export function setShow(element:Element,value:JsonValue):boolean {const hidden=!truthy(value);if((element as HTMLElement).hidden===hidden)return false;(element as HTMLElement).hidden=hidden;return true;}
