# Component integration evidence

Completed for T053 on 16 October 2026.

The product-card fixture covers typed object props, isolated quantity state, named and default slots, linked labels after ID rewriting, caller-owned events, nested component cleanup, and release accounting. The stress case mounts 100 keyed instances, reverses their DOM order, replaces one host while retaining its keyed state, removes half, and then disposes the rest. The measured midpoint is 50 component owners and 50 button listeners; final counts are zero owners, zero listeners, and zero retained DOM children, with more than 200 release callbacks observed.

Two independent roots are exercised with both IIFE/classic-shaped and ESM bundles. Their registries, stores, and root/instance ID serials remain isolated. Imported definition parsing rejects script and style content; the browser fixture also runs under strict CSP without external executable or style installation.

| Contract surface | Fixture coverage |
| --- | --- |
| `ui-component`, `ui-props`, local `ui-state` | product-card definition and per-instance scope |
| literal/reactive props and defaults | component prop unit/browser suites |
| named/default slots and caller ownership | product-card name/body projection |
| static IDs and ARIA/label references | generated label/input pairs across 100 instances |
| custom events | caller event suite in T052 |
| imports, cycles, scripts/styles, timeout | T048 import graph plus strict-CSP integration case |
| failure fallback and recursion | T052 fallback/128-ancestor cases |
| disposal and root isolation | measured 100-instance lifecycle and two-root parity cases |
