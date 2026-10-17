# Storefront example

Run either fixture backend with `--root examples/storefront`. The same files use a documented `demo` adapter for the identity or alternate response envelope.

The persisted cart contains only product IDs and quantities. Displayed totals are estimates derived from current product data; checkout sends deliberately untrusted price data and the server recomputes price and stock. A failed or uncertain mutation is never replayed automatically: use **Check order status** with the stable client order ID before submitting again.

The checkout remains an ordinary POST form without JavaScript, while enhancement adds typed models, field errors, pending state, duplicate-submit suppression, confirmation UI, and a sanitized order-summary fragment. Optional CSS is presentation only.
