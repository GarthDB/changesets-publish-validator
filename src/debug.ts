/**
 * Debug utilities for troubleshooting validation issues
 */

import * as core from '@actions/core'
import { getExecOutput } from '@actions/exec'

/**
 * Outputs debug information about the environment
 * Useful for troubleshooting validation failures
 */
export async function outputDebugInfo(): Promise<void> {
  core.startGroup('Debug Information')

  // Node.js version
  core.info(`Node.js version: ${process.version}`)

  // npm version
  try {
    const { stdout } = await getExecOutput('npm', ['--version'], {
      silent: true
    })
    core.info(`npm version: ${stdout.trim()}`)
  } catch (error) {
    core.warning(
      `Could not detect npm version: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // npm config
  try {
    const { stdout } = await getExecOutput('npm', ['config', 'list'], {
      silent: true
    })
    core.info('npm configuration:')
    core.info(stdout)
  } catch (error) {
    core.debug(
      `Could not get npm config: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // Environment variables (redacted)
  core.info('\nRelevant Environment Variables:')
  core.info(
    `NPM_TOKEN: ${process.env.NPM_TOKEN ? '***SET*** (length: ' + process.env.NPM_TOKEN.length + ')' : 'NOT SET'}`
  )
  core.info(
    `ACTIONS_ID_TOKEN_REQUEST_URL: ${process.env.ACTIONS_ID_TOKEN_REQUEST_URL ? '***SET***' : 'NOT SET'}`
  )
  core.info(
    `ACTIONS_ID_TOKEN_REQUEST_TOKEN: ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN ? '***SET***' : 'NOT SET'}`
  )
  core.info(`HOME: ${process.env.HOME || 'NOT SET'}`)
  core.info(`CI: ${process.env.CI || 'NOT SET'}`)
  core.info(`GITHUB_ACTIONS: ${process.env.GITHUB_ACTIONS || 'NOT SET'}`)

  // Check .npmrc file
  const npmrcPath = `${process.env.HOME}/.npmrc`
  try {
    const fs = await import('fs/promises')
    const exists = await fileExists(npmrcPath)
    if (exists) {
      const content = await fs.readFile(npmrcPath, 'utf8')
      core.info('\n.npmrc file found:')
      // Redact auth tokens in output
      const redacted = content.replace(
        /([:_-]authToken=)[^\n]+/gi,
        '$1***REDACTED***'
      )
      core.info(redacted)
    } else {
      core.info('\n.npmrc file: NOT FOUND')
    }
  } catch (error) {
    core.warning(
      `Could not read .npmrc: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // Check changesets config
  const changesetConfigPath = '.changeset/config.json'
  try {
    const fs = await import('fs/promises')
    const exists = await fileExists(changesetConfigPath)
    if (exists) {
      const content = await fs.readFile(changesetConfigPath, 'utf8')
      core.info('\n.changeset/config.json found:')
      core.info(content)
    } else {
      core.info('\n.changeset/config.json: NOT FOUND')
    }
  } catch (error) {
    core.warning(
      `Could not read changesets config: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // Check package.json scripts
  try {
    const fs = await import('fs/promises')
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'))
    core.info('\npackage.json scripts:')
    if (packageJson.scripts) {
      core.info(JSON.stringify(packageJson.scripts, null, 2))
    } else {
      core.info('No scripts defined')
    }
  } catch (error) {
    core.warning(
      `Could not read package.json: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // GitHub Actions permissions
  core.info('\nGitHub Actions Context:')
  core.info(`GITHUB_REPOSITORY: ${process.env.GITHUB_REPOSITORY || 'NOT SET'}`)
  core.info(`GITHUB_REF: ${process.env.GITHUB_REF || 'NOT SET'}`)
  core.info(`GITHUB_SHA: ${process.env.GITHUB_SHA || 'NOT SET'}`)
  core.info(`GITHUB_WORKFLOW: ${process.env.GITHUB_WORKFLOW || 'NOT SET'}`)

  core.endGroup()
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
