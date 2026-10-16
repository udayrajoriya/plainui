# PlainUI CLI

`plainui validate <paths...>` validates HTML and explicitly listed component files. Directories recurse lexically through HTML files while skipping hidden directories, `node_modules`, and `dist`. Use `--root <dir>`, `--manifest <file>`, `--format text|json`, and `--warnings-as-errors`. Text is the default. JSON writes exactly one `{schemaVersion,files,diagnostics,summary}` object. Exit code 0 means no failing findings, 1 means validation findings, and 2 means invalid usage, configuration, or I/O.

The optional manifest accepts only `modules`, `registrations`, `assetRoot`, and `assets`. `registrations` accepts `commands`, `formatters`, `behaviors`, and `{name,version}` adapter pairs. Missing collections are empty and `assetRoot` defaults to `.`. Without a manifest, registrations and modules that cannot be proven produce warnings.

`plainui build <entry.html> --out-dir <dir>` validates first, then copies the entry, local component imports, and manifest assets with project-relative paths. `--modules router,fragments,ui` declares optional modules and `--minify` is accepted for deterministic application workflows; application JavaScript is copied unchanged. Exact PlainUI distribution references are rewritten to `./assets/1.0.0/<basename>`. The output manifest tracks files owned by the CLI, so later builds remove only obsolete owned files and preserve unrelated content.

The build command rejects source escapes and output directories equal to or containing the source root. It stages files before replacing managed output, and a validation failure creates no output.
