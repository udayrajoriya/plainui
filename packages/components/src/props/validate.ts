import {detachedSnapshot,PlainUIError,type JsonValue} from '../../../core/src/index.js';
import type {PropRule,PropType} from '../definition.js';

export function propMatches(type:PropType,value:JsonValue):boolean {return type==='array'?Array.isArray(value):type==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):type==='number'?typeof value==='number'&&Number.isFinite(value):typeof value===type;}
export function validateProp(rule:PropRule,value:JsonValue):JsonValue {if(value===null){if(rule.required)throw new PlainUIError('PROP_TYPE');return null;}if(!propMatches(rule.type,value))throw new PlainUIError('PROP_TYPE');return detachedSnapshot(value) as JsonValue;}
export function defaultProp(rule:PropRule):JsonValue {if('default' in rule)return validateProp(rule,rule.default!);if(rule.required)throw new PlainUIError('PROP_TYPE');return null;}
