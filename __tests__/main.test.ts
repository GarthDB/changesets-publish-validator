/**
 * Integration tests for main entry point
 */

import test, { type ExecutionContext } from 'ava'
import esmock from 'esmock'

test.beforeEach(() => {
  // Clean env
  delete process.env.NPM_TOKEN
  delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL
  delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN
})

test.serial('main passes with valid OIDC environment', async (t) => {
  const { run } = await esmock(
    '../src/main.js',
    {},
    {
      '@actions/core': {
        getInput: (name: string) => {
          if (name === 'auth-method') return 'oidc'
          return ''
        },
        getBooleanInput: (name: string) => {
          if (name === 'fail-on-error') return true
          if (name === 'debug') return false
          return false
        },
        setOutput: () => {},
        setFailed: () => {},
        info: () => {},
        warning: () => {},
        error: () => {},
        startGroup: () => {},
        endGroup: () => {}
      },
      '@actions/exec': {
        getExecOutput: async () => ({
          stdout: '11.6.2',
          stderr: '',
          exitCode: 0
        })
      },
      'fs/promises': {
        access: async () => undefined,
        readFile: async () =>
          JSON.stringify({
            scripts: { release: 'changeset publish' }
          })
      }
    }
  )

  process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
  process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'

  await run()
  t.pass()
})

test.serial('main passes with valid NPM_TOKEN', async (t) => {
  const { run } = await esmock(
    '../src/main.js',
    {},
    {
      '@actions/core': {
        getInput: (name: string) => {
          if (name === 'auth-method') return 'token'
          return ''
        },
        getBooleanInput: (name: string) => {
          if (name === 'fail-on-error') return true
          if (name === 'debug') return false
          return false
        },
        setOutput: () => {},
        setFailed: () => {},
        info: () => {},
        warning: () => {},
        error: () => {},
        startGroup: () => {},
        endGroup: () => {}
      },
      'fs/promises': {
        access: async () => undefined,
        readFile: async () =>
          JSON.stringify({
            scripts: { release: 'changeset publish' }
          })
      }
    }
  )

  process.env.NPM_TOKEN = 'npm_validtoken1234567890'

  await run()
  t.pass()
})
