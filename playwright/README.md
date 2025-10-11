# End-to-end Jellyfin tests

**Step 1:** Make sure to install the dependency

```bash
npm install
```

**Step 2:** Playwright require additional tools

```bash
npx playwright install 
sudo npx playwright install-deps
```

**Step 3:** Start the Jellyfin backend long the current frontend

```bash
npm run start
```

You can force rebuild of the testing container with: 

```bash
npm run start -- --build
```

If you want to start the test container in "detached" state, use:

```bash
npm run start -- -d
```

**Step 4:** Start the tests

Leave the server running and open new terminal to start the tests (if you didn't use the "-d" option to start the test container)

```bash
npm run test
```

The text container remains running. We can continuously execute tests against it. For example:

```bash
npx playwright test -g "wizard starts on first landing"
```

**Step 5:** Stop the testing container

```bash
npm run stop
```