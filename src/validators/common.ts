/**
 * Common validations for changesets publishing
 */

import * as core from '@actions/core'
import type { ValidationResult } from '../types.js'

/**
 * Validates common prerequisites for changesets publishing
 *
 * Checks:
 * 1. .changeset/config.json exists
 * 2. package.json exists
 * 3. Node.js version compatibility
 *
 * @param cwd Working directory (defaults to process.cwd())
 * @returns ValidationResult with errors and warnings
 */
export async function validateCommon(
  cwd: string = process.cwd()
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const fs = await import('fs/promises')
  const path = await import('path')

  // Check for .changeset/config.json
  const changesetConfigPath = path.join(cwd, '.changeset', 'config.json')
  if (!(await fileExists(changesetConfigPath))) {
    errors.push(
      `Changesets configuration not found at ${changesetConfigPath}\n` +
        `Initialize changesets with:\n` +
        `  npx @changesets/cli init`
    )
  } else {
    core.info('✓ Found changesets configuration')
  }

  // Check for package.json
  const packageJsonPath = path.join(cwd, 'package.json')
  if (!(await fileExists(packageJsonPath))) {
    errors.push(
      `package.json not found at ${packageJsonPath}\n` +
        `Ensure you are running in the correct directory.`
    )
  } else {
    core.info('✓ Found package.json')

    // Check for publish/release script
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
      const scripts = packageJson.scripts || {}

      if (!scripts.release && !scripts.publish) {
        warnings.push(
          `No "release" or "publish" script found in package.json.\n` +
            `The changesets action typically needs a publish command.\n` +
            `Add a script like:\n` +
            `  "release": "changeset publish"`
        )
      } else {
        core.info('✓ Found publish/release script')
      }
    } catch (error) {
      warnings.push(
        `Could not parse package.json: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // Check Node.js version
  const nodeVersion = process.version
  core.info(`Detected Node.js version: ${nodeVersion}`)

  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10)
  if (majorVersion < 18) {
    warnings.push(
      `Node.js version ${nodeVersion} detected.\n` +
        `Node.js 18 or higher is recommended for modern npm features.\n` +
        `Update your workflow to use a newer Node.js version.`
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
