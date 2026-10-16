# Configuration reference

Schema version 1; runtime version 1.0.0. Values resolve in this order: programmatic options override the referenced `application/json` config block, which overrides the defaults. Objects merge recursively; headers merge case-insensitively. Unknown keys fail configuration.

| Path | Exact default |
|---|---|
| `api.baseUrl` | `document origin + `/`` |
| `api.headers` | `{}` |
| `api.credentials` | `same-origin` |
| `api.timeoutMs` | `30000` |
| `api.adapter` | `identity` |
| `api.allowedOrigins` | `document origin` |
| `cache.maxEntries` | `100` |
| `locale` | `en-US` |
| `timeZone` | `UTC` |
| `persistence.version` | `1` |
| `router.mode` | `history` |
| `router.basePath` | `/` |
| `security.csrf` | `null` |
| `fragments.enhance` | `false` |
| `debug` | `false` |

Root markup names a config block with `ui-config="script-id"`. The script must be unique by document ID and have `type="application/json"`. Programmatic options are passed to `PlainUI.create(options)` or `PlainUI.mount(root, options)`.
