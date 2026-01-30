/**
 * Tests for OIDC validator
 * Adapted from changesets/action PR #562
 */

import test from 'ava'
import esmock from 'esmock'

test.serial('validateOidc passes validation with correct setup', async (t) => {
  const { validateOidc } = await esmock(
    '../../src/validators/oidc.js',
    {},
    {
      '@actions/exec': {
        getExecOutput: async () => ({
          stdout: '11.6.2',
          stderr: '',
          exitCode: 0
        })
      }
    }
  )

  process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
  process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
  delete process.env.NPM_TOKEN

  const result = await validateOidc()

  t.true(result.valid)
  t.is(result.errors.length, 0)
})

test.serial(
  'validateOidc returns error for npm version < 11.5.1',
  async (t) => {
    const { validateOidc } = await esmock(
      '../../src/validators/oidc.js',
      {},
      {
        '@actions/exec': {
          getExecOutput: async () => ({
            stdout: '10.8.1',
            stderr: '',
            exitCode: 0
          })
        }
      }
    )

    process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
    delete process.env.NPM_TOKEN

    const result = await validateOidc()

    t.false(result.valid)
    t.is(result.errors.length, 1)
    t.true(result.errors[0].includes('npm version 10.8.1 detected'))
    t.true(result.errors[0].includes('npm 11.5.1+ required for OIDC'))
    t.true(result.errors[0].includes('npm install -g npm@latest'))
  }
)

test.serial(
  'validateOidc returns error for npm version 11.5.0 (edge case)',
  async (t) => {
    const { validateOidc } = await esmock(
      '../../src/validators/oidc.js',
      {},
      {
        '@actions/exec': {
          getExecOutput: async () => ({
            stdout: '11.5.0',
            stderr: '',
            exitCode: 0
          })
        }
      }
    )

    process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
    delete process.env.NPM_TOKEN

    const result = await validateOidc()

    t.false(result.valid)
    t.true(result.errors[0].includes('npm version 11.5.0 detected'))
  }
)

test.serial(
  'validateOidc passes validation for npm 11.5.1 exactly',
  async (t) => {
    const { validateOidc } = await esmock(
      '../../src/validators/oidc.js',
      {},
      {
        '@actions/exec': {
          getExecOutput: async () => ({
            stdout: '11.5.1',
            stderr: '',
            exitCode: 0
          })
        }
      }
    )

    process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
    delete process.env.NPM_TOKEN

    const result = await validateOidc()

    t.true(result.valid)
    t.is(result.errors.length, 0)
  }
)

test.serial(
  'validateOidc handles npm version with leading/trailing whitespace',
  async (t) => {
    const { validateOidc } = await esmock(
      '../../src/validators/oidc.js',
      {},
      {
        '@actions/exec': {
          getExecOutput: async () => ({
            stdout: '  11.6.2\n',
            stderr: '',
            exitCode: 0
          })
        }
      }
    )

    process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
    process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
    delete process.env.NPM_TOKEN

    const result = await validateOidc()

    t.true(result.valid)
    t.is(result.errors.length, 0)
  }
)

test.serial(
  'validateOidc collects multiple errors when multiple checks fail',
  async (t) => {
    const { validateOidc } = await esmock(
      '../../src/validators/oidc.js',
      {},
      {
        '@actions/exec': {
          getExecOutput: async () => ({
            stdout: '10.8.1',
            stderr: '',
            exitCode: 0
          })
        }
      }
    )

    delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL
    process.env.NPM_TOKEN = 'npm_token123'

    const result = await validateOidc()

    t.false(result.valid)
    t.true(result.errors.length >= 2)
  }
)
