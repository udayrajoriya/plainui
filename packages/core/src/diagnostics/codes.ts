import { DIAGNOSTICS, type DiagnosticCode } from '../../../schema/src/diagnostics.js';
export { DIAGNOSTICS };
export type { DiagnosticCode };
export class PlainUIError extends Error {
  readonly code:DiagnosticCode;
  constructor(code:DiagnosticCode) { super(DIAGNOSTICS[code][1]); this.name='PlainUIError'; this.code=code; }
}
