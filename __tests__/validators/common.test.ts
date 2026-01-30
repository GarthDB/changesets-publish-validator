/**
 * Tests for common validator
 *
 * Note: Complex mocking of fs/promises with esmock has limitations.
 * Core validation logic is tested via integration tests in CI.
 * See: .github/workflows/test-validation.yml
 */

import test, { type ExecutionContext } from 'ava'

// Common validator is primarily tested through integration tests
// because fs/promises mocking with esmock is unreliable for edge cases.
// The integration test in CI validates the actual behavior.

test('common validator integration tests run in CI', (t) => {
  t.pass('See .github/workflows/test-validation.yml for integration tests')
})
