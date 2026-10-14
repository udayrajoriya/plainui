import {truthy} from '../expression/evaluate.js';
import type {JsonValue} from '../json/normalize.js';
export function setShow(element:Element,value:JsonValue):boolean {const hidden=!truthy(value);if(element.hasAttribute('hidden')===hidden)return false;element.toggleAttribute('hidden',hidden);return true;}
