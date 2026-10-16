# Router hosting

History mode needs an application-document fallback for browser document requests beneath the configured `basePath`. For `basePath: "/app"`, serve the application HTML for `/app`, `/app/`, and nested document paths such as `/app/products/42`. Keep real static assets and API paths ahead of that fallback so missing assets remain ordinary 404 responses and missing API routes retain their JSON 404 response.

Hash mode requires no server fallback. The server only receives the document path; PlainUI reads routes such as `#/app/products/42?q=a#details` from the fragment.

With JavaScript disabled, ordinary anchor behavior remains available. History links request their destination from the server, so the fallback determines the returned document. Hash links load the same document and preserve the fragment. Client fallback rendering cannot create a server HTTP 404 status or route-specific crawler metadata; configure those at the host when they matter.

Example nginx history fallback:

```nginx
location /assets/ { try_files $uri =404; }
location /api/ { try_files $uri =404; }
location /app/ { try_files $uri $uri/ /app/index.html; }
```
