import type { ActionService } from '../../core/src/integration.js';

/** Forms depends on this interface, never a data controller implementation. */
export type DataActionService = ActionService;
