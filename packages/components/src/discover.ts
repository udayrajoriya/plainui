import {ComponentRegistry} from './registry.js';

/** DOM selectors do not descend into inert template contents, so inactive branch definitions stay local. */
export function discoverInline(root:Element,registry:ComponentRegistry):void {const candidates=[root,...root.querySelectorAll('template[ui-component],template[data-ui-component]')];for(const element of candidates)if(element instanceof HTMLTemplateElement&&(element.hasAttribute('ui-component')||element.hasAttribute('data-ui-component')))registry.register(element);}
