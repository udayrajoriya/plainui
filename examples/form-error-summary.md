# Form error summary pattern

Place a live summary inside the action form and bind the action's global error message:

```html
<form method="post" action="/api/save" ui-post="/api/save" ui-action="save">
  <p role="alert" aria-live="polite" ui-text="save.error.message"></p>
  <label for="email">Email</label>
  <input id="email" name="email">
  <p ui-field-error="email"></p>
  <button type="submit">Save</button>
</form>
```

`ui-field-error` shows only fields with matching names. For unrecognized field names, read the complete `save.error.fields` action record and render a separate authored summary using `textContent`. Keep the global message visible while a single field is edited. No popup or server-provided HTML is inserted automatically.
