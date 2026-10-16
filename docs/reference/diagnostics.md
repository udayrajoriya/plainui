# Diagnostic reference

Errors reject the current invalid operation or retain its last valid output. Warnings report recoverable state without stopping the root. Values, response bodies, credentials, and query strings are never included in diagnostic messages.

| Code | Severity | Safe message | Cause and remedy |
|---|---|---|---|
| `CONFIG_INVALID` | error | Configuration is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `ROOT_INVALID` | error | Application root is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `ROOT_ALREADY_MOUNTED` | error | Application root is already mounted. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `MODULE_MISSING` | error | Required module is unavailable. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `MODULE_VERSION` | error | Module version is incompatible. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `UNKNOWN_DIRECTIVE` | error | Directive is not registered. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `DIRECTIVE_CONFLICT` | error | Directives conflict. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `DIRECTIVE_VALUE` | error | Directive value or placement is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `DECLARATION_DUPLICATE` | error | Declaration name is duplicated. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `RESERVED_NAME` | error | Declaration name is reserved. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `JSON_INVALID` | error | JSON value is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `PATH_INVALID` | error | Writable path is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `STATE_READONLY` | error | State is read-only. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `EXPRESSION_PARSE` | error | Expression syntax is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `EXPRESSION_TYPE` | error | Expression type is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `EXPRESSION_LIMIT` | error | Expression limit exceeded. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `IDENTIFIER_UNKNOWN` | error | Identifier is unknown. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `FORMATTER_UNKNOWN` | error | Formatter is unknown. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `DERIVED_CYCLE` | error | Derived dependency cycle detected. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `UPDATE_LOOP` | error | Reactive update limit exceeded. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `BATCH_ASYNC` | error | Batch callback must be synchronous. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `PERSISTENCE_INVALID` | warning | Stored value is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `PERSISTENCE_STORAGE` | warning | Storage operation failed. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `URL_POLICY` | error | URL is not permitted. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `REQUEST_ORIGIN` | error | Request destination is not permitted. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `REQUEST_INVALID` | error | Request is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `REQUEST_TIMEOUT` | error | Request timed out. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `RESPONSE_TYPE` | error | Response media type is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `RESPONSE_PARSE` | error | Response could not be parsed. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `ADAPTER_ERROR` | error | Adapter failed. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `ADAPTER_TIMEOUT` | error | Adapter timed out. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `RESOURCE_SUSPENDED` | error | Resource URL is incomplete. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `RESOURCE_VISIBILITY_TARGET` | error | Visibility target is unavailable. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `RESOURCE_UNKNOWN` | error | Resource is unknown. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `COMMAND_ERROR` | error | Command failed. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `REF_INVALID` | error | Reference is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `DUPLICATE_KEY` | error | Loop key is duplicated. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `LOOP_INVALID` | error | Loop is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `COMPONENT_IMPORT_CYCLE` | error | Component import cycle detected. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `COMPONENT_IMPORT` | error | Component import failed. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `COMPONENT_DEFINITION` | error | Component definition is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `COMPONENT_RECURSION` | error | Component recursion limit exceeded. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `PROP_TYPE` | error | Component prop is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `SLOT_INVALID` | error | Component slot is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `ROUTE_INVALID` | error | Route is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `ROUTER_DOCUMENT_OWNER` | error | Document already has a router. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `GUARD_ERROR` | error | Navigation guard failed. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `FRAGMENT_POLICY` | error | Fragment policy rejected content. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `FRAGMENT_ACTIVATION` | error | Fragment activation failed. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `BEHAVIOR_INVALID` | error | Behavior is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `FORM_INVALID` | error | Form is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `UI_INVALID` | error | UI helper is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `OWNER_DISPOSED` | warning | Owner is disposed. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `OWNER_RANGE` | error | Owned DOM range is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `DECLARATION_CHANGED` | warning | Mounted declaration changed. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `REGISTRY_INVALID` | error | Registration is invalid. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
| `INSPECTOR_DISABLED` | error | Inspector is disabled. | Correct the directive, value, ownership, registration, or lifecycle condition identified by the code; the current invalid output is not committed. |
