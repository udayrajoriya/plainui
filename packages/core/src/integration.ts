/** Private service contracts shared across package boundaries. */
export interface RequestService {
  send(request: Request, signal: AbortSignal): Promise<Response>;
}

export interface DomService {
  parseInert(markup: string, ownerDocument: Document): DocumentFragment;
}

export interface ActionService {
  submit(form: HTMLFormElement, signal: AbortSignal): Promise<unknown>;
}

export interface RuntimeServices {
  readonly request: RequestService;
  readonly dom: DomService;
  readonly actions: ActionService;
}
