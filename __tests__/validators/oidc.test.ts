/**
 * Tests for OIDC validator
 * Adapted from changesets/action PR #562
 */

import test from 'ava'
import esmock from 'esmock'

test.beforeEach(() => {
  // Clean up env
  delete process.env.NPM_TOKEN
  delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL
  delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN
})

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

    const result = await validateOidc()

    t.true(result.valid)
    t.is(result.errors.length, 0)
  }
)

test.serial(
  'validateOidc returns error for missing id-token permission',
  async (t) => {
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

    delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL

    const result = await validateOidc()

    t.false(result.valid)
    t.is(result.errors.length, 1)
    t.true(result.errors[0].includes('ACTIONS_ID_TOKEN_REQUEST_URL is not set'))
    t.true(result.errors[0].includes('id-token: write'))
  }
)

test.serial('validateOidc returns error when NPM_TOKEN is set', async (t) => {
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
  process.env.NPM_TOKEN = 'npm_token123'

  const result = await validateOidc()

  t.false(result.valid)
  t.true(
    result.errors.some((e) =>
      e.includes('NPM_TOKEN is set but OIDC mode is enabled')
    )
  )
})

test.serial(
  'validateOidc returns error when OIDC token request variable is missing',
  async (t) => {
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
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN

    const result = await validateOidc()

    t.false(result.valid)
    t.true(
      result.errors.some((e) =>
        e.includes('ACTIONS_ID_TOKEN_REQUEST_TOKEN is not set')
      )
    )
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

    const result = await validateOidc()

    t.true(result.valid)
    t.is(result.errors.length, 0)
  }
)

test.serial('validateOidc returns error when npm command fails', async (t) => {
  const { validateOidc } = await esmock(
    '../../src/validators/oidc.js',
    {},
    {
      '@actions/exec': {
        getExecOutput: async () => ({
          stdout: '',
          stderr: 'command not found',
          exitCode: 127
        })
      }
    }
  )

  process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
  process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'

  const result = await validateOidc()

  t.false(result.valid)
  t.true(result.errors.some((e) => e.includes('Failed to get npm version')))
})

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
