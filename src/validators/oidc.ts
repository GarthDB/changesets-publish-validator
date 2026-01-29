/**
 * OIDC validation for npm trusted publishing
 * Adapted from changesets/action PR #562
 */

import { getExecOutput } from '@actions/exec'
import * as core from '@actions/core'
import semver from 'semver'
import type { ValidationResult } from '../types.js'

/**
 * Validates OIDC environment for npm trusted publishing
 *
 * Checks:
 * 1. npm version >= 11.5.1 (required for OIDC support)
 * 2. id-token: write permission (via ACTIONS_ID_TOKEN_REQUEST_URL env var)
 * 3. No conflicting NPM_TOKEN set
 * 4. OIDC token request variables are present
 *
 * @returns ValidationResult with errors and warnings
 */
export async function validateOidc(): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check npm version
  try {
    const { stdout } = await getExecOutput('npm', ['--version'], {
      silent: true
    })
    const npmVersion = stdout.trim()
    core.info(`Detected npm version: ${npmVersion}`)

    if (!semver.gte(npmVersion, '11.5.1')) {
      errors.push(
        `npm version ${npmVersion} detected. npm 11.5.1+ required for OIDC.\n` +
          `Add step to your workflow:\n` +
          `  - name: Update npm\n` +
          `    run: npm install -g npm@latest`
      )
    }
  } catch (error) {
    errors.push(
      `Failed to check npm version: ${error instanceof Error ? error.message : String(error)}\n` +
        `Ensure npm is installed and accessible.`
    )
  }

  // Check for id-token permission
  if (!process.env.ACTIONS_ID_TOKEN_REQUEST_URL) {
    errors.push(
      `id-token: write permission not detected.\n` +
        `Add to your workflow:\n` +
        `permissions:\n` +
        `  contents: write\n` +
        `  pull-requests: write\n` +
        `  id-token: write`
    )
  } else {
    core.info('✓ id-token: write permission detected')
  }

  // Check for OIDC token request variables
  if (!process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) {
    errors.push(
      `ACTIONS_ID_TOKEN_REQUEST_TOKEN environment variable not found.\n` +
        `This indicates an issue with GitHub Actions OIDC configuration.`
    )
  }

  // Check that NPM_TOKEN is not set (conflicting auth methods)
  if (process.env.NPM_TOKEN) {
    errors.push(
      `NPM_TOKEN is set but auth-method is "oidc".\n` +
        `Remove NPM_TOKEN from your workflow:\n` +
        `  1. Remove NPM_TOKEN from env section\n` +
        `  2. Or switch to auth-method: token`
    )
  } else {
    core.info('✓ No conflicting NPM_TOKEN found')
  }

  // Check for npm registry configuration conflicts
  const npmrcPath = `${process.env.HOME}/.npmrc`
  try {
    const fs = await import('fs/promises')
    if (await fileExists(npmrcPath)) {
      const content = await fs.readFile(npmrcPath, 'utf8')
      if (content.includes('//registry.npmjs.org/:_authToken=')) {
        warnings.push(
          `Found existing authToken in ~/.npmrc file.\n` +
            `This may conflict with OIDC authentication.\n` +
            `Consider removing it or ensuring it's not for registry.npmjs.org`
        )
      }
    }
  } catch (error) {
    // Non-critical, just a warning scenario
    core.debug(
      `Could not check .npmrc: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Helper to check if file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    const fs = await import('fs/promises')
    await fs.access(path)
    return true
  } catch {
    return false
  }
}
