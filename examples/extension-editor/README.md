# CodeMirror behavior

This example requires PlainUI 1.x, CodeMirror 6.0.2, and `@codemirror/state` 6.7.6. `editor.js` uses plain JavaScript registration before `mount()`. The editor instance stays in the factory closure and renders inside `ui-ignore`. A labeled textarea remains as the accessible native fallback. Updates compare strings before writing through the scoped `get` and `set` methods, and cleanup removes the synchronization listener and destroys the editor.
