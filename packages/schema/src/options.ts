import { FORBIDDEN_KEYS, IDENTIFIER } from './allowlists.js';

export type SchemaNode = { type: 'object'; properties: Record<string,SchemaNode>; additional?: boolean } | { type: 'string'; values?: readonly string[]; nonempty?: boolean } | { type: 'boolean' } | { type: 'integer'; min: number; max?: number } | { type: 'array'; item: SchemaNode } | { type: 'nullable'; item: SchemaNode } | { type: 'record'; item: SchemaNode };
const object = (properties: Record<string,SchemaNode>): SchemaNode => ({type:'object',properties});
const string = (values?: readonly string[]): SchemaNode => values ? {type:'string',values} : {type:'string',nonempty:true};
const integer = (min: number, max?: number): SchemaNode => max === undefined ? {type:'integer',min} : {type:'integer',min,max};
export const CONFIG_SCHEMA = object({
  api: object({baseUrl:string(),headers:{type:'record',item:{type:'string'}},credentials:string(['omit','same-origin','include']),timeoutMs:integer(1),adapter:string(),allowedOrigins:{type:'array',item:string()}}),
  cache:object({maxEntries:integer(0)}),locale:string(),timeZone:string(),persistence:object({version:integer(1)}),router:object({mode:string(['history','hash']),basePath:string()}),security:object({csrf:{type:'nullable',item:object({header:string(),meta:string()})}}),fragments:object({enhance:{type:'boolean'}}),debug:{type:'boolean'},
});
export const TABS_SCHEMA = object({activation:string(['manual','automatic']),orientation:string(['horizontal','vertical'])});
export const TOAST_SCHEMA = object({toastDurationMs:integer(0)});
export const PROP_DEFINITION_SCHEMA = object({type:string(['string','number','boolean','object','array']),required:{type:'boolean'},default:{type:'nullable',item:{type:'record',item:{type:'string'}}}});
export type SchemaIssue = { path: string; reason: 'unknown'|'type'|'range'|'value'|'forbidden' };
export function validateSchema(value: unknown, schema: SchemaNode, path = '$'): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const walk = (item: unknown, node: SchemaNode, at: string): void => {
    if (node.type === 'nullable') { if (item !== null) walk(item,node.item,at); return; }
    if (node.type === 'string') { if (typeof item !== 'string') issues.push({path:at,reason:'type'}); else if ((node.nonempty && !item.trim()) || (node.values && !node.values.includes(item))) issues.push({path:at,reason:'value'}); return; }
    if (node.type === 'boolean') { if (typeof item !== 'boolean') issues.push({path:at,reason:'type'}); return; }
    if (node.type === 'integer') { if (typeof item !== 'number' || !Number.isSafeInteger(item)) issues.push({path:at,reason:'type'}); else if (item < node.min || (node.max !== undefined && item > node.max)) issues.push({path:at,reason:'range'}); return; }
    if (node.type === 'array') { if (!Array.isArray(item)) issues.push({path:at,reason:'type'}); else item.forEach((v,i) => walk(v,node.item,`${at}[${i}]`)); return; }
    if (typeof item !== 'object' || item === null || Array.isArray(item)) { issues.push({path:at,reason:'type'}); return; }
    for (const [key,desc] of Object.entries(Object.getOwnPropertyDescriptors(item))) {
      const child = `${at}.${key}`;
      if (FORBIDDEN_KEYS.has(key) || !('value' in desc)) { issues.push({path:child,reason:'forbidden'}); continue; }
      if (node.type === 'record') walk(desc.value,node.item,child);
      else if (Object.hasOwn(node.properties,key)) walk(desc.value,node.properties[key]!,child);
      else if (!node.additional) issues.push({path:child,reason:'unknown'});
    }
  };
  walk(value,schema,path);
  return issues;
}
export type PropDefinition = { type:'string'|'number'|'boolean'|'object'|'array'; required?:boolean; default?:unknown };
export function validatePropsSchema(input: unknown): SchemaIssue[] {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return [{path:'$',reason:'type'}];
  const issues: SchemaIssue[] = [];
  for (const [name, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(input))) {
    if (!IDENTIFIER.test(name) || FORBIDDEN_KEYS.has(name) || !('value' in descriptor)) { issues.push({path:`$.${name}`,reason:'forbidden'}); continue; }
    const definition = descriptor.value;
    if (typeof definition !== 'object' || definition === null || Array.isArray(definition)) { issues.push({path:`$.${name}`,reason:'type'}); continue; }
    const entries = Object.entries(Object.getOwnPropertyDescriptors(definition));
    for (const [key,desc] of entries) if (!['type','required','default'].includes(key) || !('value' in desc)) issues.push({path:`$.${name}.${key}`,reason:'unknown'});
    const prop = definition as PropDefinition;
    if (!['string','number','boolean','object','array'].includes(prop.type)) issues.push({path:`$.${name}.type`,reason:'value'});
    if (prop.required !== undefined && typeof prop.required !== 'boolean') issues.push({path:`$.${name}.required`,reason:'type'});
    if (prop.required === true && Object.hasOwn(prop,'default')) issues.push({path:`$.${name}.default`,reason:'value'});
    if (Object.hasOwn(prop,'default') && prop.default !== null && typeof prop.default !== prop.type) issues.push({path:`$.${name}.default`,reason:'type'});
  }
  return issues;
}
export function validateBehaviorOptions(name: string, value: unknown): SchemaIssue[] {
  if (name === 'tabs') return validateSchema(value,TABS_SCHEMA);
  if (name === 'toasts') return validateSchema(value,TOAST_SCHEMA);
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? validateSchema(value,{type:'record',item:{type:'nullable',item:{type:'record',item:{type:'string'}}}}) : [{path:'$',reason:'type'}];
}
