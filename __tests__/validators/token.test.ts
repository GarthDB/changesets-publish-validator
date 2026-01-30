/**
 * Tests for token validator
 */

import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach
} from '@jest/globals'
import * as core from '@actions/core'
import { validateToken } from '../../src/validators/token'

jest.mock('@actions/core')

describe('Token validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('validateToken', () => {
    it('passes validation with valid NPM_TOKEN', async () => {
      process.env.NPM_TOKEN = 'npm_validtoken1234567890'
      delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL

      const result = await validateToken()

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns error when NPM_TOKEN is missing', async () => {
      delete process.env.NPM_TOKEN

      const result = await validateToken()

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain(
        'NPM_TOKEN environment variable is not set'
      )
      expect(result.errors[0]).toContain('secrets.NPM_TOKEN')
    })

    it('returns error when NPM_TOKEN is empty', async () => {
      process.env.NPM_TOKEN = ''

      const result = await validateToken()

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('NPM_TOKEN is set but empty'))
      ).toBe(true)
    })

    it('returns error when NPM_TOKEN is too short', async () => {
      process.env.NPM_TOKEN = 'short'

      const result = await validateToken()

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('NPM_TOKEN appears to be invalid'))
      ).toBe(true)
    })

    it('returns warning when NPM_TOKEN does not start with npm_ prefix', async () => {
      process.env.NPM_TOKEN = 'legacy-token-1234567890'

      const result = await validateToken()

      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain('does not start with "npm_" prefix')
    })

    it('returns warning when OIDC is available but using token', async () => {
      process.env.NPM_TOKEN = 'npm_validtoken1234567890'
      process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'

      const result = await validateToken()

      expect(result.valid).toBe(true)
      expect(
        result.warnings.some((w) => w.includes('Consider switching to OIDC'))
      ).toBe(true)
    })

    it('handles whitespace-only token as empty', async () => {
      process.env.NPM_TOKEN = '   \n\t  '

      const result = await validateToken()

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('NPM_TOKEN is set but empty'))
      ).toBe(true)
    })

    it('accepts valid modern npm token', async () => {
      process.env.NPM_TOKEN = 'npm_1234567890abcdefghijklmnopqrstuvwxyz'
      delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL

      const result = await validateToken()

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
    })
  })
})
