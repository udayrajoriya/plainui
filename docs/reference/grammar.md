# Expression and command grammar

PlainUI expressions contain JSON literals, identifiers, member/index reads, arrays, objects with quoted keys, formatter calls, unary `!`/`-`, arithmetic and comparison operators, `&&`, `||`, `??`, and the ternary operator. Postfix reads bind first, unary operators follow, then multiplicative, additive, comparison/equality, logical, nullish, and ternary operations. Mixing `??` with ungrouped `&&` or `||` is invalid. Truthiness follows JavaScript for normalized JSON values.

Expression source is UTF-8 and limited to the runtime parser limits: AST depth 128 and one 10,000-step shared evaluation budget per command invocation. Property reads consume steps. Forbidden prototype keys, constructors, assignment, statements, dynamic code, and arbitrary method calls are rejected.

Writable paths contain an identifier followed by safe dotted or bracketed property segments. Commands are semicolon-separated effect calls. `set` and `toggle` take a writable path first; other arguments are pure expressions. Nested effect calls are rejected. Lifecycle handlers run after the associated record and DOM bindings commit; `finally` runs after success or error handlers.

URL templates substitute scalar expression values with component encoding. Query objects use URL encoding and repeated array keys. Formatters receive detached read-only JSON and must return normalized JSON. App methods resolve application scope; command and behavior scope APIs resolve lexically.
