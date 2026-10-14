import { createScaffoldApp, getModuleBridge } from '../../core/src/module-bridge.js';
import { DATA_PACKAGE_STUB } from '../../data/src/index.js';
import { FORMS_PACKAGE_STUB } from '../../forms/src/index.js';
import { COMPONENTS_PACKAGE_STUB } from '../../components/src/index.js';
import type { ActionService, DomService, RequestService, RuntimeServices } from '../../core/src/integration.js';
import type { AppScaffold, OfficialModuleBridge } from '../../core/src/module-bridge.js';

const unavailableRequest: RequestService = Object.freeze({
  send(): Promise<Response> {
    return Promise.reject(new Error('PlainUI request service is scheduled for T030'));
  },
});
const unavailableDom: DomService = Object.freeze({
  parseInert(): DocumentFragment {
    throw new Error('PlainUI DOM service is scheduled for T017');
  },
});
const unavailableActions: ActionService = Object.freeze({
  submit(): Promise<unknown> {
    return Promise.reject(new Error('PlainUI action service is scheduled for T035'));
  },
});

/** Private composition seam. T017 injects the real implementations here. */
export function composeRuntimeServices(
  request: RequestService,
  dom: DomService,
  actions: ActionService,
): RuntimeServices {
  return Object.freeze({ request, dom, actions });
}

const scaffoldServices = composeRuntimeServices(unavailableRequest, unavailableDom, unavailableActions);

export const bundledFoundationPackages = Object.freeze([
  'core',
  DATA_PACKAGE_STUB,
  FORMS_PACKAGE_STUB,
  COMPONENTS_PACKAGE_STUB,
]);

export const PlainUI = Object.freeze({
  __foundationPackages: bundledFoundationPackages,
  create(options:unknown={}): AppScaffold {
    return createScaffoldApp(scaffoldServices,options);
  },
  mount(root: Element,options:unknown={}): AppScaffold {
    return createScaffoldApp(scaffoldServices,options).mount(root);
  },
  __moduleBridge_v1: getModuleBridge(),
});

export { getModuleBridge };
export type { AppScaffold, OfficialModuleBridge };
