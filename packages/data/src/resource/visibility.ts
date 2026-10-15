import {PlainUIError} from '../../../core/src/index.js';

/** A resource template observes its containing element, never template content. */
export function visibilityTarget(element:Element):Element {const parent=element.parentElement;if(!parent||!parent.isConnected||parent.closest('template'))throw new PlainUIError('RESOURCE_VISIBILITY_TARGET');return parent;}
export function observeFirstIntersection(element:Element,onVisible:()=>void):()=>void {const target=visibilityTarget(element),view=element.ownerDocument.defaultView;if(!view||!('IntersectionObserver' in view))throw new PlainUIError('RESOURCE_VISIBILITY_TARGET');let active=true;const observer=new IntersectionObserver(entries=>{if(!active||!entries.some(entry=>entry.isIntersecting))return;active=false;observer.disconnect();onVisible();},{root:null});observer.observe(target);return()=>{active=false;observer.disconnect();};}
