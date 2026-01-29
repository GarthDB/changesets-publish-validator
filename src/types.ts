/**
 * Types for the changesets publish validator action
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export type AuthMethod = 'oidc' | 'token'

export interface ActionInputs {
  authMethod: AuthMethod
  failOnError: boolean
  debug: boolean
}
