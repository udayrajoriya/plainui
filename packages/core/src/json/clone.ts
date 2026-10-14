import { normalizeJson, type JsonValue } from './normalize.js';
export function cloneJson(value:JsonValue):JsonValue { return normalizeJson(value); }
