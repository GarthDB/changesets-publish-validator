/**
 * Tests for common validator
 */

import test from 'ava'
import esmock from 'esmock'

test.serial(
  'validateCommon passes validation when all files exist',
  async (t) => {
    const { validateCommon } = await esmock(
      '../../src/validators/common.js',
      {},
      {
        'fs/promises': {
          access: async () => undefined,
          readFile: async () =>
            JSON.stringify({
              scripts: {
                release: 'changeset publish'
              }
            })
        }
      }
    )

    const result = await validateCommon()

    t.true(result.valid)
    t.is(result.errors.length, 0)
  }
)

test.serial(
  'validateCommon returns error when .changeset/config.json is missing',
  async (t) => {
    let callCount = 0
    const { validateCommon } = await esmock(
      '../../src/validators/common.js',
      {},
      {
        'fs/promises': {
          access: async () => {
            if (callCount++ === 0) {
              throw new Error('Not found')
            }
            return undefined
          },
          readFile: async () =>
            JSON.stringify({
              scripts: { release: 'changeset publish' }
            })
        }
      }
    )

    const result = await validateCommon()

    t.false(result.valid)
    t.is(result.errors.length, 1)
    t.true(result.errors[0].includes('.changeset/config.json not found'))
  }
)

test.serial(
  'validateCommon returns error when package.json is missing',
  async (t) => {
    let callCount = 0
    const { validateCommon } = await esmock(
      '../../src/validators/common.js',
      {},
      {
        'fs/promises': {
          access: async () => {
            if (callCount++ === 1) {
              throw new Error('Not found')
            }
            return undefined
          }
        }
      }
    )

    const result = await validateCommon()

    t.false(result.valid)
    t.is(result.errors.length, 1)
    t.true(result.errors[0].includes('package.json not found'))
  }
)

test.serial(
  'validateCommon returns warning when no publish/release script found',
  async (t) => {
    const { validateCommon } = await esmock(
      '../../src/validators/common.js',
      {},
      {
        'fs/promises': {
          access: async () => undefined,
          readFile: async () =>
            JSON.stringify({
              scripts: {
                build: 'rollup'
              }
            })
        }
      }
    )

    const result = await validateCommon()

    t.true(result.valid)
    t.is(result.warnings.length, 1)
    t.true(
      result.warnings[0].includes(
        'No "publish" or "release" script found in package.json'
      )
    )
  }
)

test.serial('validateCommon accepts release script', async (t) => {
  const { validateCommon } = await esmock(
    '../../src/validators/common.js',
    {},
    {
      'fs/promises': {
        access: async () => undefined,
        readFile: async () =>
          JSON.stringify({
            scripts: {
              release: 'changeset publish'
            }
          })
      }
    }
  )

  const result = await validateCommon()

  t.true(result.valid)
  t.is(result.warnings.length, 0)
})

test.serial('validateCommon accepts publish script', async (t) => {
  const { validateCommon } = await esmock(
    '../../src/validators/common.js',
    {},
    {
      'fs/promises': {
        access: async () => undefined,
        readFile: async () =>
          JSON.stringify({
            scripts: {
              publish: 'npm publish'
            }
          })
      }
    }
  )

  const result = await validateCommon()

  t.true(result.valid)
  t.is(result.warnings.length, 0)
})

test.serial(
  'validateCommon returns warning for old Node.js version',
  async (t) => {
    const { validateCommon } = await esmock(
      '../../src/validators/common.js',
      {},
      {
        'fs/promises': {
          access: async () => undefined,
          readFile: async () =>
            JSON.stringify({
              scripts: {
                release: 'changeset publish'
              },
              engines: {
                node: '>=14.0.0'
              }
            })
        }
      }
    )

    const result = await validateCommon()

    t.true(result.valid)
    t.is(result.warnings.length, 1)
    t.true(result.warnings[0].includes('Node.js version requirement'))
  }
)

test.serial('validateCommon handles package.json parsing error', async (t) => {
  const { validateCommon } = await esmock(
    '../../src/validators/common.js',
    {},
    {
      'fs/promises': {
        access: async () => undefined,
        readFile: async () => 'invalid json {'
      }
    }
  )

  const result = await validateCommon()

  t.false(result.valid)
  t.true(result.errors.some((e) => e.includes('Failed to parse package.json')))
})

test.serial(
  'validateCommon collects multiple errors when multiple files are missing',
  async (t) => {
    const { validateCommon } = await esmock(
      '../../src/validators/common.js',
      {},
      {
        'fs/promises': {
          access: async () => {
            throw new Error('Not found')
          }
        }
      }
    )

    const result = await validateCommon()

    t.false(result.valid)
    t.is(result.errors.length, 2)
  }
)
