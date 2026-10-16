# Reconcile an uncertain mutation

Aborting a client request does not prove the server canceled its mutation. After a replaced, dropped, or timed-out nonidempotent action, refresh the authoritative GET resource before allowing a retry:

```js
const latest = await app.refresh('items');
// Compare this accepted server value with the intended mutation before retrying.
```

The framework never automatically retries POST, PUT, PATCH, or DELETE. The application should use a server-provided idempotency key if it needs retry-safe writes.
