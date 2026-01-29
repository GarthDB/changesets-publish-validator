/**
 * Tests for common validator
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
import { validateCommon } from '../../src/validators/common'
import fs from 'fs/promises'

jest.mock('@actions/core')
jest.mock('fs/promises')

describe('Common validation', () => {
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

  describe('validateCommon', () => {
    it('passes validation when all files exist', async () => {
      // Mock file access - both files exist
      jest.mocked(fs.access).mockResolvedValue(undefined)
      jest.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          scripts: {
            release: 'changeset publish'
          }
        })
      )

      const result = await validateCommon()

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns error when .changeset/config.json is missing', async () => {
      // Mock: .changeset/config.json does not exist, but package.json does
      jest
        .mocked(fs.access)
        .mockImplementationOnce(() => Promise.reject(new Error('Not found')))
        .mockResolvedValueOnce(undefined)

      jest.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          scripts: { release: 'changeset publish' }
        })
      )

      const result = await validateCommon()

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) =>
          e.includes('Changesets configuration not found')
        )
      ).toBe(true)
      expect(
        result.errors.some((e) => e.includes('npx @changesets/cli init'))
      ).toBe(true)
    })

    it('returns error when package.json is missing', async () => {
      // Mock: .changeset/config.json exists but package.json does not
      jest
        .mocked(fs.access)
        .mockResolvedValueOnce(undefined)
        .mockImplementationOnce(() => Promise.reject(new Error('Not found')))

      const result = await validateCommon()

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('package.json not found'))
      ).toBe(true)
    })

    it('returns warning when no publish/release script found', async () => {
      jest.mocked(fs.access).mockResolvedValue(undefined)
      jest.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          scripts: {
            test: 'jest'
          }
        })
      )

      const result = await validateCommon()

      expect(result.valid).toBe(true)
      expect(
        result.warnings.some((w) =>
          w.includes('No "release" or "publish" script found')
        )
      ).toBe(true)
    })

    it('accepts release script', async () => {
      jest.mocked(fs.access).mockResolvedValue(undefined)
      jest.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          scripts: {
            release: 'changeset publish'
          }
        })
      )

      const result = await validateCommon()

      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })

    it('accepts publish script', async () => {
      jest.mocked(fs.access).mockResolvedValue(undefined)
      jest.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          scripts: {
            publish: 'npm publish'
          }
        })
      )

      const result = await validateCommon()

      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })

    it('returns warning for old Node.js version', async () => {
      jest.mocked(fs.access).mockResolvedValue(undefined)
      jest.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          scripts: { release: 'changeset publish' }
        })
      )

      // Mock process.version for old Node
      const originalVersion = process.version
      Object.defineProperty(process, 'version', {
        value: 'v16.14.0',
        writable: true,
        configurable: true
      })

      const result = await validateCommon()

      expect(result.valid).toBe(true)
      expect(
        result.warnings.some((w) =>
          w.includes('Node.js 18 or higher is recommended')
        )
      ).toBe(true)

      // Restore
      Object.defineProperty(process, 'version', {
        value: originalVersion,
        writable: true,
        configurable: true
      })
    })

    it('handles package.json parsing error', async () => {
      jest.mocked(fs.access).mockResolvedValue(undefined)
      jest.mocked(fs.readFile).mockResolvedValue('invalid json {')

      const result = await validateCommon()

      expect(result.valid).toBe(true) // Non-critical error
      expect(
        result.warnings.some((w) => w.includes('Could not parse package.json'))
      ).toBe(true)
    })

    it('collects multiple errors when multiple files are missing', async () => {
      // Both files missing
      jest.mocked(fs.access).mockRejectedValue(new Error('Not found'))

      const result = await validateCommon()

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBe(2)
    })
  })
})
