import type { DataActionService } from '../../data/src/action-service.js';

export interface FormsDependencies {
  readonly actions: DataActionService;
}

export const FORMS_PACKAGE_STUB = 'forms' as const;
