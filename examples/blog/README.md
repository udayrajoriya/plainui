# Public blog example

Build the distribution, then run either fixture server with this directory as its root:

```sh
node examples/backends/node/server.mjs --host 127.0.0.1 --port 43181 --root examples/blog --data-dir .tools/blog-node --test-mode true
python examples/backends/python/server.py --host 127.0.0.1 --port 43182 --root examples/blog --data-dir .tools/blog-python --test-mode
```

The server renders list and article documents with ordinary links, search forms, title, description, and article text. JavaScript replaces that document view after `app.ready`; this is progressive enhancement, not hydration. Client-side route titles cannot change the HTTP status or metadata originally served by the backend.

The imported `article-card` is shared unchanged by both servers. Article bodies use PlainUI's default untrusted fragment mode, so scripts, styles, event handlers, and framework directives are removed. The JSON-only client route depends on JavaScript; direct document requests remain readable because the fixture backend renders the same article text.
