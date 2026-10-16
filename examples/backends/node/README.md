# Node fixture backend

Requires Node and the repository's pinned `busboy` 1.6.0 dependency.

```sh
node examples/backends/node/server.mjs --host 127.0.0.1 --port 43181 --root examples/blog --data-dir .tools/backend-node --test-mode true
```

The server prints one JSON startup record and fails immediately if the port is occupied. `Ctrl+C` performs graceful shutdown. Test mode enables loopback-only `POST /__test/reset` and the `x-plainui-test-delay`/`x-plainui-test-error` controls. Uploaded bytes are parsed in memory, reported only as metadata, and never written under the asset root. The cookie/session implementation and `plainui-demo` password are sample fixtures, not production authentication guidance.
