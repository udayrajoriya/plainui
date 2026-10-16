# Python fixture backend

Requires Python 3.13.7 for release qualification and the pinned `python-multipart` 0.0.32 package. Development tests may report a different interpreter and do not qualify that version.

```sh
python examples/backends/python/server.py --host 127.0.0.1 --port 43182 --root examples/blog --data-dir .tools/backend-python --test-mode
```

The server prints one JSON startup record and fails immediately if the port is occupied. `Ctrl+C` performs graceful shutdown. Test mode enables loopback-only `POST /__test/reset` and the `x-plainui-test-delay`/`x-plainui-test-error` controls. Multipart parsing uses `python_multipart.parse_form` callbacks; uploaded names are reduced to basenames, bytes remain in parser-owned temporary storage, and nothing is placed under the asset root. The session implementation is a local sample only.
