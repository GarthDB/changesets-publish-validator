/**
 * Integration tests for main entry point
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
import { getExecOutput } from '@actions/exec'
import { run } from '../src/main'
import * as fs from 'fs/promises'

jest.mock('@actions/core')
jest.mock('@actions/exec')
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  rmdir: jest.fn(),
  unlink: jest.fn(),
  stat: jest.fn(),
  readdir: jest.fn()
}))

describe('Main action', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }

    // Mock common file checks
    fs.access.mockResolvedValue(undefined)
    fs.readFile.mockResolvedValue(
      JSON.stringify({
        scripts: { release: 'changeset publish' }
      })
    )
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('OIDC mode', () => {
    beforeEach(() => {
      core.getInput.mockImplementation((name: string) => {
        if (name === 'auth-method') return 'oidc'
        return ''
      })
      core.getBooleanInput.mockImplementation((name: string) => {
        if (name === 'fail-on-error') return true
        if (name === 'debug') return false
        return false
      })
    })

    it('passes with valid OIDC environment', async () => {
      jest.mocked(getExecOutput).mockResolvedValue({
        stdout: '11.6.2',
        stderr: '',
        exitCode: 0
      })
      process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
      process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
      delete process.env.NPM_TOKEN

      await run()

      expect(core.setOutput).toHaveBeenCalledWith('valid', 'true')
      expect(core.setFailed).not.toHaveBeenCalled()
    })

    it('fails with invalid npm version', async () => {
      jest.mocked(getExecOutput).mockResolvedValue({
        stdout: '10.8.1',
        stderr: '',
        exitCode: 0
      })
      process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
      process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
      delete process.env.NPM_TOKEN

      await run()

      expect(core.setOutput).toHaveBeenCalledWith('valid', 'false')
      expect(core.setFailed).toHaveBeenCalled()
    })

    it('fails when id-token permission is missing', async () => {
      jest.mocked(getExecOutput).mockResolvedValue({
        stdout: '11.6.2',
        stderr: '',
        exitCode: 0
      })
      delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL
      delete process.env.NPM_TOKEN

      await run()

      expect(core.setOutput).toHaveBeenCalledWith('valid', 'false')
      expect(core.setFailed).toHaveBeenCalled()
    })
  })

  describe('Token mode', () => {
    beforeEach(() => {
      core.getInput.mockImplementation((name: string) => {
        if (name === 'auth-method') return 'token'
        return ''
      })
      core.getBooleanInput.mockImplementation((name: string) => {
        if (name === 'fail-on-error') return true
        if (name === 'debug') return false
        return false
      })
    })

    it('passes with valid NPM_TOKEN', async () => {
      process.env.NPM_TOKEN = 'npm_validtoken1234567890'
      delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL

      await run()

      expect(core.setOutput).toHaveBeenCalledWith('valid', 'true')
      expect(core.setFailed).not.toHaveBeenCalled()
    })

    it('fails when NPM_TOKEN is missing', async () => {
      delete process.env.NPM_TOKEN

      await run()

      expect(core.setOutput).toHaveBeenCalledWith('valid', 'false')
      expect(core.setFailed).toHaveBeenCalled()
    })
  })

  describe('Invalid auth-method', () => {
    it('fails with invalid auth-method', async () => {
      core.getInput.mockImplementation((name: string) => {
        if (name === 'auth-method') return 'invalid'
        return ''
      })
      core.getBooleanInput.mockReturnValue(true)

      await run()

      expect(core.setFailed).toHaveBeenCalledWith(
        expect.stringContaining('Invalid auth-method')
      )
    })
  })

  describe('fail-on-error option', () => {
    beforeEach(() => {
      core.getInput.mockImplementation((name: string) => {
        if (name === 'auth-method') return 'token'
        return ''
      })
    })

    it('does not fail when fail-on-error is false', async () => {
      core.getBooleanInput.mockImplementation((name: string) => {
        if (name === 'fail-on-error') return false
        if (name === 'debug') return false
        return false
      })
      delete process.env.NPM_TOKEN

      await run()

      expect(core.setOutput).toHaveBeenCalledWith('valid', 'false')
      expect(core.setFailed).not.toHaveBeenCalled()
    })

    it('fails when fail-on-error is true', async () => {
      core.getBooleanInput.mockImplementation((name: string) => {
        if (name === 'fail-on-error') return true
        if (name === 'debug') return false
        return false
      })
      delete process.env.NPM_TOKEN

      await run()

      expect(core.setOutput).toHaveBeenCalledWith('valid', 'false')
      expect(core.setFailed).toHaveBeenCalled()
    })
  })

  describe('debug mode', () => {
    beforeEach(() => {
      core.getInput.mockImplementation((name: string) => {
        if (name === 'auth-method') return 'oidc'
        return ''
      })
    })

    it('outputs debug info when debug is true', async () => {
      core.getBooleanInput.mockImplementation((name: string) => {
        if (name === 'fail-on-error') return true
        if (name === 'debug') return true
        return false
      })

      jest.mocked(getExecOutput).mockResolvedValue({
        stdout: '11.6.2',
        stderr: '',
        exitCode: 0
      })
      process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.com'
      process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-token'
      delete process.env.NPM_TOKEN

      await run()

      // Check that debug group was started
      expect(core.startGroup).toHaveBeenCalledWith('Debug Information')
    })
  })
})
