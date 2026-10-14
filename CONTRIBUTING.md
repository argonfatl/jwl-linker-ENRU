# Contributing

## Development

The plugin is a single `main.js` file (no build step). Tests use Node's built-in test runner and need no dependencies:

```bash
npm test          # parsing, formatting and citation tests (tests/)
npm run check     # syntax check of main.js
```

Every pull request runs the tests on GitHub Actions.

## Releasing a new version

Replace `X.Y.Z` with the new version number, for example `0.9.0`.

1. In a pull request, update the version in three files:
   - `manifest.json`: `"version": "X.Y.Z"`
   - `package.json`: `"version": "X.Y.Z"`
   - `versions.json`: add `"X.Y.Z": "<minAppVersion>"` (the `minAppVersion` from `manifest.json`)

2. Merge the pull request.

3. Update your local `main` branch. The tag must point to the commit that contains the new version, otherwise the release check stops:

   ```bash
   git checkout main
   git pull
   ```

4. Create the tag and push it. The tag is exactly the version number, without a `v` prefix:

   ```bash
   git tag X.Y.Z
   git push origin X.Y.Z
   ```

5. The *Release* GitHub Action then:
   - checks that the tag matches `manifest.json` and that `versions.json` has an entry for it;
   - runs the tests;
   - creates a signed build provenance attestation for the release files;
   - publishes a GitHub release with `main.js`, `manifest.json` and `styles.css`.

   The Obsidian community directory picks up the new release automatically.

### If a tag was pushed too early

If the release check failed because the tag points to an old commit, move the tag to the current `main`:

```bash
git checkout main
git pull
git tag -d X.Y.Z
git push origin :refs/tags/X.Y.Z
git tag X.Y.Z
git push origin X.Y.Z
```
