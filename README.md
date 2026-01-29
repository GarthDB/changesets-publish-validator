# Changesets Publish Validator

Validate npm publishing prerequisites for changesets workflows _before_
publishing, with actionable error messages.

[![GitHub Super-Linter](https://github.com/GarthDB/changesets-publish-validator/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/GarthDB/changesets-publish-validator/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/GarthDB/changesets-publish-validator/actions/workflows/check-dist.yml/badge.svg)](https://github.com/GarthDB/changesets-publish-validator/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/GarthDB/changesets-publish-validator/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/GarthDB/changesets-publish-validator/actions/workflows/codeql-analysis.yml)

## Why This Action?

When using [changesets/action](https://github.com/changesets/action) for npm
publishing, configuration issues often result in cryptic error messages after
waiting through your entire CI pipeline. This action validates your environment
**upfront**, providing clear, actionable feedback.

### Real-World Problems This Solves

Based on production experience at Adobe, this action catches these common
issues:

1. **npm version too old** - Many workflows use npm 10.x, which doesn't support
   OIDC
2. **Missing `id-token: write`** - Easy to forget this permission for OIDC
3. **Conflicting auth** - Users accidentally leave `NPM_TOKEN` while trying OIDC
4. **Incomplete setup** - Missing OIDC environment variables or invalid tokens

### Error Message Comparison

#### Without Validation (cryptic npm errors)

```
npm error code ENEEDAUTH
npm error need auth This command requires you to be logged in to https://registry.npmjs.org/
```

#### With Validation (actionable guidance)

```
Error: npm version 10.8.1 detected. npm 11.5.1+ required for OIDC.
Add step to your workflow:
  - name: Update npm
    run: npm install -g npm@latest
```

## Usage

Run this action **before** `changesets/action` in your workflow to validate your
publishing environment.

### OIDC Authentication (Recommended)

```yaml
name: Release

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write
  id-token: write # Required for OIDC

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm install -g npm@latest

      - run: npm install

      # Validate OIDC environment before proceeding
      - name: Validate Publishing Prerequisites
        uses: GarthDB/changesets-publish-validator@v1
        with:
          auth-method: oidc

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: npm run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # No NPM_TOKEN needed with OIDC!
```

### Token-Based Authentication (Legacy)

```yaml
name: Release

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm install

      # Validate token before proceeding
      - name: Validate Publishing Prerequisites
        uses: GarthDB/changesets-publish-validator@v1
        with:
          auth-method: token
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: npm run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Inputs

| Input           | Description                                       | Required | Default |
| --------------- | ------------------------------------------------- | -------- | ------- |
| `auth-method`   | Authentication method: `"oidc"` or `"token"`      | Yes      | -       |
| `fail-on-error` | Whether to fail the workflow on validation errors | No       | `true`  |
| `debug`         | Enable debug output with full environment info    | No       | `false` |

## Outputs

| Output  | Description                                       |
| ------- | ------------------------------------------------- |
| `valid` | Whether validation passed (`"true"` or `"false"`) |

## Validation Checks

### OIDC Mode (`auth-method: oidc`)

✅ **npm version** - Ensures npm >= 11.5.1 (required for OIDC support)  
✅ **id-token permission** - Verifies `ACTIONS_ID_TOKEN_REQUEST_URL` is set  
✅ **OIDC tokens** - Checks `ACTIONS_ID_TOKEN_REQUEST_TOKEN` is available  
✅ **No conflicts** - Ensures `NPM_TOKEN` is not set  
⚠️ **`.npmrc` conflicts** - Warns about existing auth tokens

### Token Mode (`auth-method: token`)

✅ **NPM_TOKEN presence** - Ensures token is set and non-empty  
✅ **Token format** - Validates token has reasonable length  
⚠️ **Token prefix** - Warns if token doesn't start with `npm_`  
⚠️ **OIDC availability** - Suggests OIDC if `id-token` permission detected  
⚠️ **`.npmrc` config** - Checks for existing configuration

### Common Checks (Both Modes)

✅ **Changesets config** - Verifies `.changeset/config.json` exists  
✅ **package.json** - Checks for publish/release script  
⚠️ **Node.js version** - Warns if < 18

## Debug Mode

Enable debug mode to troubleshoot validation issues:

```yaml
- name: Validate Publishing Prerequisites
  uses: GarthDB/changesets-publish-validator@v1
  with:
    auth-method: oidc
    debug: true
```

Debug output includes:

- Node.js and npm versions
- npm configuration
- Environment variables (redacted)
- `.npmrc` contents (redacted)
- Changesets configuration
- package.json scripts

## Advanced Usage

### Advisory Mode

Set `fail-on-error: false` to run validation as an advisory check without
failing the workflow:

```yaml
- name: Validate Publishing Prerequisites (Advisory)
  uses: GarthDB/changesets-publish-validator@v1
  with:
    auth-method: oidc
    fail-on-error: false
  continue-on-error: true
```

### Use Output in Conditional Steps

```yaml
- name: Validate Publishing Prerequisites
  id: validate
  uses: GarthDB/changesets-publish-validator@v1
  with:
    auth-method: oidc
    fail-on-error: false

- name: Proceed with Publishing
  if: steps.validate.outputs.valid == 'true'
  uses: changesets/action@v1
  with:
    publish: npm run release
```

## Migration from NPM_TOKEN to OIDC

### Prerequisites

1. **npm CLI 11.5.1+** - Update in your workflow:

   ```yaml
   - run: npm install -g npm@latest
   ```

2. **Configure Trusted Publisher** on [npmjs.com](https://www.npmjs.com/):
   - Go to your organization/package settings
   - Navigate to "Publishing Access"
   - Add a trusted publisher with:
     - Subject Type: GitHub Actions
     - Organization: `your-org`
     - Repository: `your-repo`
     - Workflow File: `release.yml` (or your workflow filename)

3. **Add `id-token: write` permission** to your workflow:
   ```yaml
   permissions:
     contents: write
     pull-requests: write
     id-token: write
   ```

### Migration Steps

1. Add npm update step to your workflow
2. Configure trusted publisher on npmjs.com
3. Add `id-token: write` permission
4. Change `auth-method` from `token` to `oidc` in this action
5. Remove `NPM_TOKEN` from your workflow env
6. (Optional) Delete `NPM_TOKEN` secret from GitHub

### Benefits of OIDC

- ✅ No long-lived tokens to manage or rotate
- ✅ Cryptographic provenance attestation automatically generated
- ✅ More secure authentication flow
- ✅ Eliminates risk of token leakage

## Error Reference

### Common Errors and Solutions

<details>
<summary><code>npm version X detected. npm 11.5.1+ required for OIDC</code></summary>

**Cause:** Your workflow is using an older version of npm that doesn't support
OIDC.

**Solution:** Add an npm update step before publishing:

```yaml
- name: Update npm
  run: npm install -g npm@latest
```

</details>

<details>
<summary><code>id-token: write permission not detected</code></summary>

**Cause:** Your workflow doesn't have the required permission for OIDC.

**Solution:** Add `id-token: write` to your workflow permissions:

```yaml
permissions:
  contents: write
  pull-requests: write
  id-token: write
```

</details>

<details>
<summary><code>NPM_TOKEN is set but auth-method is "oidc"</code></summary>

**Cause:** You have both OIDC and token auth configured, causing a conflict.

**Solution:** Remove `NPM_TOKEN` from your workflow's `env` section, or switch
to `auth-method: token`.

</details>

<details>
<summary><code>NPM_TOKEN environment variable is not set</code></summary>

**Cause:** Token-based auth requires an `NPM_TOKEN` secret.

**Solution:** Either:

1. Add `NPM_TOKEN` to your workflow and GitHub secrets, or
2. Switch to OIDC: `auth-method: oidc`
</details>

<details>
<summary><code>Changesets configuration not found</code></summary>

**Cause:** No `.changeset/config.json` file in your repository.

**Solution:** Initialize changesets:

```bash
npx @changesets/cli init
```

</details>

## Development

### Prerequisites

- Node.js 20+ (see `.node-version`)
- npm 10+

### Setup

```bash
npm install
```

### Testing

```bash
npm test              # Run tests
npm run ci-test       # Run tests in CI mode
npm run coverage      # Generate coverage badge
```

### Building

```bash
npm run bundle        # Format, package, and bundle
npm run all           # Format, lint, test, coverage, and package
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for your changes
4. Ensure all tests pass: `npm run all`
5. Submit a pull request

## License

[MIT](LICENSE)

## Related Projects

- [changesets/action](https://github.com/changesets/action) - The official
  changesets GitHub Action
- [changesets/changesets](https://github.com/changesets/changesets) - A way to
  manage versioning and changelogs
- [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers) - Official
  npm OIDC documentation

## Acknowledgments

- Inspired by [PR #562](https://github.com/changesets/action/pull/562) to
  changesets/action
- Built with the
  [actions/typescript-action](https://github.com/actions/typescript-action)
  template
- Validation logic based on production experience at Adobe
