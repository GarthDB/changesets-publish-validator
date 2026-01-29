/**
 * Tests for OIDC validator
 * Adapted from changesets/action PR #562
 */

import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach
} from '@jest/globals'
import { getExecOutput } from '@actions/exec'
import * as core from '@actions/core'
import { validateOidc } from '../../src/validators/oidc'

jest.mock('@actions/exec')
jest.mock('@actions/core')

describe('OIDC validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    // Mock core.info to suppress logs in tests
    jest.spyOn(core, 'info').mockImplementation(() => {})
    jest.spyOn(core, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('validateOidc', () => {
    it('passes validation with correct setup', async () => {
      jest.mocked(getExecOutput).mockResolvedValue({
        stdout: '11.6.2',
        stderr: '',
        exitCode: 0
      })
      process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
      process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
      delete process.env.NPM_TOKEN

      const result = await validateOidc()

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns error for npm version < 11.5.1', async () => {
      jest.mocked(getExecOutput).mockResolvedValue({
        stdout: '10.8.1',
        stderr: '',
        exitCode: 0
      })
      process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
      process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
      delete process.env.NPM_TOKEN

      const result = await validateOidc()

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('npm version 10.8.1 detected')
      expect(result.errors[0]).toContain('npm 11.5.1+ required for OIDC')
      expect(result.errors[0]).toContain('npm install -g npm@latest')
    })

    it('returns error for npm version 11.5.0 (edge case)', async () => {
      jest.mocked(getExecOutput).mockResolvedValue({
        stdout: '11.5.0',
        stderr: '',
        exitCode: 0
      })
      process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
      process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
      delete process.env.NPM_TOKEN

      const result = await validateOidc()

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('npm version 11.5.0 detected')
    })

    it('passes validation for npm 11.5.1 exactly', async () => {
      jest.mocked(getExecOutput).mockResolvedValue({
        stdout: '11.5.1',
        stderr: '',
        exitCode: 0
      })
      process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
      process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
      delete process.env.NPM_TOKEN

      const result = await validateOidc()

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns error for missing id-token permission', async () => {
      jest.mocked(getExecOutput).mockResolvedValue({
        stdout: '11.6.2',
        stderr: '',
        exitCode: 0
      })
      delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL
      delete process.env.NPM_TOKEN

      const result = await validateOidc()

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) =>
          e.includes('id-token: write permission not detected')
        )
      ).toBe(true)
      expect(result.errors.some((e) => e.includes('permissions:'))).toBe(true)
    })

    it('returns error when NPM_TOKEN is set', async () => {
      jest.mocked(getExecOutput).mockResolvedValue({
        stdout: '11.6.2',
        stderr: '',
        exitCode: 0
      })
      process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
      process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
      process.env.NPM_TOKEN = 'secret-token'

      const result = await validateOidc()

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) =>
          e.includes('NPM_TOKEN is set but auth-method is "oidc"')
        )
      ).toBe(true)
    })

    it('returns error when OIDC token request variable is missing', async () => {
      jest.mocked(getExecOutput).mockResolvedValue({
        stdout: '11.6.2',
        stderr: '',
        exitCode: 0
      })
      process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
      delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN
      delete process.env.NPM_TOKEN

      const result = await validateOidc()

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('ACTIONS_ID_TOKEN_REQUEST_TOKEN'))
      ).toBe(true)
    })

    it('handles npm version with leading/trailing whitespace', async () => {
      jest.mocked(getExecOutput).mockResolvedValue({
        stdout: '  11.6.2\n',
        stderr: '',
        exitCode: 0
      })
      process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
      process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
      delete process.env.NPM_TOKEN

      const result = await validateOidc()

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns error when npm command fails', async () => {
      jest
        .mocked(getExecOutput)
        .mockRejectedValue(new Error('npm command not found'))
      process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
      process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
      delete process.env.NPM_TOKEN

      const result = await validateOidc()

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('Failed to check npm version'))
      ).toBe(true)
    })

    it('collects multiple errors when multiple checks fail', async () => {
      jest.mocked(getExecOutput).mockResolvedValue({
        stdout: '10.0.0',
        stderr: '',
        exitCode: 0
      })
      delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL
      delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN
      process.env.NPM_TOKEN = 'token'

      const result = await validateOidc()

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })
})
