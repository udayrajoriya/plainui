# Authenticated SaaS example

Start either fixture backend with `--root examples/saas`, open `/login`, and use `demo@example.test` / `plainui-demo`. The app uses only public PlainUI APIs. Logout advances the session epoch and clears the named user persistence key before calling the server.
