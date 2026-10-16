# Optional styles

`plainui.css` is optional. Runtime behavior, native semantics, focus order, validation, and the `hidden` attribute work without it.

The stylesheet defines `--ui-color-bg`, `--ui-color-text`, `--ui-color-primary`, `--ui-color-danger`, `--ui-space-1` through `--ui-space-6`, `--ui-radius`, and `--ui-font` on `:root`. Override them after loading the stylesheet:

```css
:root {
  --ui-color-primary: #6d28d9;
  --ui-space-4: 1.25rem;
}
```

The layout classes are `.ui-stack`, `.ui-cluster`, `.ui-grid`, and `.ui-container`. Their defaults can be changed locally with `--ui-stack-gap`, `--ui-cluster-gap`, `--ui-grid-gap`, `--ui-container-width`, and `--ui-container-padding`. All spacing uses logical properties, so the same markup supports left-to-right and right-to-left documents.

`.ui-stack` creates a vertical flex layout. `.ui-cluster` creates a wrapping row. `.ui-grid` creates responsive columns that never exceed their container. `.ui-container` centers content at a maximum width of `72rem` with `1rem` inline padding.

The baseline styles preserve native controls and dialogs, show focus indicators, mark invalid fields, honor `disabled`, force `[hidden]` out of layout, and remove optional motion when `prefers-reduced-motion: reduce` is active.
