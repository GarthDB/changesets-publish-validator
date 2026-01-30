# 🎉 Changesets Publish Validator v1.0.0

Validate npm publishing prerequisites for changesets workflows **before**
publishing, with clear, actionable error messages.

## ✨ Features

### Authentication Validation

- ✅ **OIDC Support** - Validates npm 11.5.1+, `id-token: write` permissions,
  and OIDC environment
- ✅ **Token Support** - Validates `NPM_TOKEN` presence, format, and conflicts
- ✅ **Dual Mode** - Seamlessly supports both authentication methods

### Smart Validation

- 🔍 Checks changesets configuration (`.changeset/config.json`)
- 📦 Verifies `package.json` publish/release scripts
- 🔧 Validates Node.js version compatibility
- 🐛 **Debug Mode** - Detailed environment diagnostics for troubleshooting

### Developer Experience

- 📝 Clear, actionable error messages with remediation steps
- ⚡ Fails fast before wasting CI time
- 🎯 Based on real production issues from Adobe

## 🚀 Quick Start

### OIDC Authentication (Recommended)

```yaml
- name: Validate Publishing Prerequisites
  uses: GarthDB/changesets-publish-validator@v1
  with:
    auth-method: oidc
```

### Token Authentication

```yaml
- name: Validate Publishing Prerequisites
  uses: GarthDB/changesets-publish-validator@v1
  with:
    auth-method: token
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 📊 Error Message Comparison

| Without Validation                                                                             | With Validation                                                                                                                                |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm error code ENEEDAUTH`<br/>`npm error need auth This command requires you to be logged in` | `Error: npm version 10.8.1 detected. npm 11.5.1+ required for OIDC.`<br/>`Add step to your workflow:`<br/>`  - run: npm install -g npm@latest` |

## 🎯 Common Issues Caught

This action validates and prevents these 4 production issues:

1. **Old npm version** - Detects npm < 11.5.1 (doesn't support OIDC)
2. **Missing permissions** - Catches missing `id-token: write` permission
3. **Auth conflicts** - Identifies `NPM_TOKEN` + OIDC conflicts
4. **Invalid tokens** - Validates token format and presence

## 📖 Documentation

- [**Complete Usage Guide**](https://github.com/GarthDB/changesets-publish-validator#readme)
- [**Error Reference**](https://github.com/GarthDB/changesets-publish-validator#error-reference)
- [**Migration Guide**](https://github.com/GarthDB/changesets-publish-validator#migration-from-npm_token-to-oidc)
  (NPM_TOKEN → OIDC)
- [**Debug Mode**](https://github.com/GarthDB/changesets-publish-validator#debug-mode)

## 🧪 Testing

- ✅ Comprehensive unit tests for all validators
- ✅ Integration tests for complete workflows
- ✅ CI with validation test matrix
- ✅ 100% coverage of validation logic

## 🙏 Credits

- Inspired by
  [changesets/action PR #562](https://github.com/changesets/action/pull/562)
- Built with
  [actions/typescript-action](https://github.com/actions/typescript-action)
  template
- Validation logic based on production experience at Adobe

## 📝 Inputs

| Input           | Description                                       | Required | Default |
| --------------- | ------------------------------------------------- | -------- | ------- |
| `auth-method`   | Authentication method: `"oidc"` or `"token"`      | Yes      | -       |
| `fail-on-error` | Whether to fail the workflow on validation errors | No       | `true`  |
| `debug`         | Enable debug output with full environment info    | No       | `false` |

## 📤 Outputs

| Output  | Description                                       |
| ------- | ------------------------------------------------- |
| `valid` | Whether validation passed (`"true"` or `"false"`) |

## 🔗 Links

- [Repository](https://github.com/GarthDB/changesets-publish-validator)
- [Issues](https://github.com/GarthDB/changesets-publish-validator/issues)
- [Discussions](https://github.com/GarthDB/changesets-publish-validator/discussions)

---

**Full Changelog**:
https://github.com/GarthDB/changesets-publish-validator/commits/v1.0.0
