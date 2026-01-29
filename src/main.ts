/**
 * Main entry point for the changesets publish validator action
 */

import * as core from '@actions/core'
import type { ActionInputs, AuthMethod, ValidationResult } from './types.js'
import { validateOidc } from './validators/oidc.js'
import { validateToken } from './validators/token.js'
import { validateCommon } from './validators/common.js'
import { outputDebugInfo } from './debug.js'

/**
 * Parses action inputs
 */
function getInputs(): ActionInputs {
  const authMethodInput = core.getInput('auth-method', { required: true })
  const authMethod = authMethodInput.toLowerCase() as AuthMethod

  if (authMethod !== 'oidc' && authMethod !== 'token') {
    throw new Error(
      `Invalid auth-method: "${authMethodInput}". Must be "oidc" or "token".`
    )
  }

  return {
    authMethod,
    failOnError: core.getBooleanInput('fail-on-error'),
    debug: core.getBooleanInput('debug')
  }
}

/**
 * Formats validation results for output
 */
function formatResults(result: ValidationResult, label: string): void {
  if (result.errors.length > 0) {
    core.startGroup(`❌ ${label} - ${result.errors.length} error(s)`)
    for (const error of result.errors) {
      core.error(error)
    }
    core.endGroup()
  } else {
    core.info(`✓ ${label} - passed`)
  }

  if (result.warnings.length > 0) {
    core.startGroup(`⚠️  ${label} - ${result.warnings.length} warning(s)`)
    for (const warning of result.warnings) {
      core.warning(warning)
    }
    core.endGroup()
  }
}

/**
 * Combines multiple validation results
 */
function combineResults(...results: ValidationResult[]): ValidationResult {
  return {
    valid: results.every((r) => r.valid),
    errors: results.flatMap((r) => r.errors),
    warnings: results.flatMap((r) => r.warnings)
  }
}

/**
 * Main action execution
 */
export async function run(): Promise<void> {
  try {
    const inputs = getInputs()

    core.info('🔍 Changesets Publish Validator')
    core.info(`Authentication method: ${inputs.authMethod}`)
    core.info(`Fail on error: ${inputs.failOnError}`)
    core.info(`Debug mode: ${inputs.debug}`)
    core.info('')

    // Output debug info if requested
    if (inputs.debug) {
      await outputDebugInfo()
    }

    // Run common validations
    core.startGroup('Running common validations')
    const commonResult = await validateCommon()
    formatResults(commonResult, 'Common validations')
    core.endGroup()

    // Run auth-specific validations
    let authResult: ValidationResult

    if (inputs.authMethod === 'oidc') {
      core.startGroup('Running OIDC validations')
      authResult = await validateOidc()
      formatResults(authResult, 'OIDC validations')
      core.endGroup()
    } else {
      core.startGroup('Running token validations')
      authResult = await validateToken()
      formatResults(authResult, 'Token validations')
      core.endGroup()
    }

    // Combine results
    const finalResult = combineResults(commonResult, authResult)

    // Set outputs
    core.setOutput('valid', finalResult.valid.toString())

    // Summary
    core.info('')
    if (finalResult.valid) {
      core.info('✅ All validations passed!')
      core.info(
        'Your environment is properly configured for npm publishing with changesets.'
      )
    } else {
      const errorCount = finalResult.errors.length
      const warningCount = finalResult.warnings.length

      core.info(`❌ Validation failed with ${errorCount} error(s)`)
      if (warningCount > 0) {
        core.info(`⚠️  ${warningCount} warning(s) found`)
      }

      core.info('')
      core.info('Please fix the errors above and try again.')
      core.info(
        'For more information, run this action with debug: true for detailed environment info.'
      )

      if (inputs.failOnError) {
        throw new Error(
          `Validation failed with ${errorCount} error(s). See logs above for details.`
        )
      }
    }
  } catch (error) {
    // Handle unexpected errors
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed(String(error))
    }
  }
}
