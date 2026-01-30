/**
 * Token-based authentication validation for npm publishing
 */

import * as core from '@actions/core'
import type { ValidationResult } from '../types.js'

/**
 * Validates NPM_TOKEN environment for traditional token-based publishing
 *
 * Checks:
 * 1. NPM_TOKEN environment variable is set
 * 2. Token has reasonable format (not empty, reasonable length)
 * 3. No conflicting OIDC configuration
 *
 * @returns ValidationResult with errors and warnings
 */
export async function validateToken(): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // Check NPM_TOKEN presence
  const npmToken = process.env.NPM_TOKEN

  if (npmToken === undefined) {
    errors.push(
      `NPM_TOKEN environment variable is not set.\n` +
        `Add to your workflow:\n` +
        `  env:\n` +
        `    NPM_TOKEN: \${{ secrets.NPM_TOKEN }}\n\n` +
        `And ensure you have created the NPM_TOKEN secret in your repository settings.\n` +
        `See: https://docs.npmjs.com/creating-and-viewing-authentication-tokens`
    )
  } else {
    core.info('✓ NPM_TOKEN is set')

    // Validate token format
    if (npmToken.trim().length === 0) {
      errors.push(
        `NPM_TOKEN is set but empty. Please provide a valid npm token.`
      )
    } else if (npmToken.trim().length < 10) {
      errors.push(
        `NPM_TOKEN appears to be invalid (too short).\n` +
          `Ensure you have copied the full token from npmjs.com`
      )
    } else {
      core.info('✓ NPM_TOKEN has valid length')
    }

    // Check for typical token prefixes (npm tokens typically start with npm_)
    if (!npmToken.startsWith('npm_')) {
      warnings.push(
        `NPM_TOKEN does not start with "npm_" prefix.\n` +
          `Modern npm tokens typically start with "npm_".\n` +
          `Legacy tokens may still work, but consider regenerating your token.`
      )
    }
  }

  // Check for conflicting OIDC configuration
  if (process.env.ACTIONS_ID_TOKEN_REQUEST_URL) {
    warnings.push(
      `Detected id-token: write permission but using token-based auth.\n` +
        `Consider switching to OIDC authentication (auth-method: oidc) for better security.\n` +
        `See: https://docs.npmjs.com/trusted-publishers`
    )
  }

  // Check .npmrc for existing configuration
  const npmrcPath = `${process.env.HOME}/.npmrc`
  try {
    const fs = await import('fs/promises')
    if (await fileExists(npmrcPath)) {
      const content = await fs.readFile(npmrcPath, 'utf8')
      if (content.includes('//registry.npmjs.org/:_authToken=')) {
        core.info('✓ Found existing .npmrc with auth configuration')
        warnings.push(
          `Found existing authToken in ~/.npmrc file.\n` +
            `Ensure it matches your NPM_TOKEN environment variable.\n` +
            `The changesets action will append NPM_TOKEN if not present.`
        )
      }
    }
  } catch (error) {
    // Non-critical
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
