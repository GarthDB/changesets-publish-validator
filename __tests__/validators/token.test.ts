/**
 * Tests for token validator
 */

import test, { type ExecutionContext } from 'ava'
import { validateToken } from '../../src/validators/token.js'

test.beforeEach(() => {
  // Save original env
  delete process.env.NPM_TOKEN
  delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL
})

test.serial(
  'validateToken passes validation with valid NPM_TOKEN',
  async (t) => {
    process.env.NPM_TOKEN = 'npm_validtoken1234567890'
    delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL

    const result = await validateToken()

    t.true(result.valid)
    t.is(result.errors.length, 0)
  }
)

test.serial(
  'validateToken returns error when NPM_TOKEN is missing',
  async (t) => {
    delete process.env.NPM_TOKEN

    const result = await validateToken()

    t.false(result.valid)
    t.is(result.errors.length, 1)
    t.true(
      result.errors[0].includes('NPM_TOKEN environment variable is not set')
    )
    t.true(result.errors[0].includes('secrets.NPM_TOKEN'))
  }
)

test.serial(
  'validateToken returns error when NPM_TOKEN is empty',
  async (t) => {
    process.env.NPM_TOKEN = ''

    const result = await validateToken()

    t.false(result.valid)
    t.true(result.errors.some((e) => e.includes('NPM_TOKEN is set but empty')))
  }
)

test.serial(
  'validateToken returns error when NPM_TOKEN is too short',
  async (t) => {
    process.env.NPM_TOKEN = 'short'

    const result = await validateToken()

    t.false(result.valid)
    t.true(
      result.errors.some((e) => e.includes('NPM_TOKEN appears to be invalid'))
    )
  }
)

test.serial(
  'validateToken returns warning when NPM_TOKEN does not start with npm_ prefix',
  async (t) => {
    process.env.NPM_TOKEN = 'legacy-token-1234567890'

    const result = await validateToken()

    t.true(result.valid)
    t.is(result.warnings.length, 1)
    t.true(result.warnings[0].includes('does not start with "npm_" prefix'))
  }
)

test.serial(
  'validateToken returns warning when OIDC is available but using token',
  async (t) => {
    process.env.NPM_TOKEN = 'npm_validtoken1234567890'
    process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'

    const result = await validateToken()

    t.true(result.valid)
    t.true(
      result.warnings.some((w) => w.includes('Consider switching to OIDC'))
    )
  }
)

test.serial(
  'validateToken handles whitespace-only token as empty',
  async (t) => {
    process.env.NPM_TOKEN = '   \n\t  '

    const result = await validateToken()

    t.false(result.valid)
    t.true(result.errors.some((e) => e.includes('NPM_TOKEN is set but empty')))
  }
)

test.serial('validateToken accepts valid modern npm token', async (t) => {
  process.env.NPM_TOKEN = 'npm_1234567890abcdefghijklmnopqrstuvwxyz'
  delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL

  const result = await validateToken()

  t.true(result.valid)
  t.is(result.errors.length, 0)
  t.is(result.warnings.length, 0)
})
