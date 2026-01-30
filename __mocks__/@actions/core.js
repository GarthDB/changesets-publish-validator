/**
 * Manual mock for @actions/core (ESM compatible)
 */

export const debug = jest.fn()
export const error = jest.fn()
export const warning = jest.fn()
export const notice = jest.fn()
export const info = jest.fn()
export const startGroup = jest.fn()
export const endGroup = jest.fn()
export const group = jest.fn()
export const saveState = jest.fn()
export const getState = jest.fn()
export const getInput = jest.fn()
export const getBooleanInput = jest.fn()
export const getMultilineInput = jest.fn()
export const setOutput = jest.fn()
export const setCommandEcho = jest.fn()
export const setFailed = jest.fn()
export const isDebug = jest.fn(() => false)
export const exportVariable = jest.fn()
export const setSecret = jest.fn()
export const addPath = jest.fn()
export const getIDToken = jest.fn()
export const summary = {
  addRaw: jest.fn(),
  addHeading: jest.fn(),
  addCodeBlock: jest.fn(),
  addList: jest.fn(),
  addTable: jest.fn(),
  addDetails: jest.fn(),
  addImage: jest.fn(),
  addHtml: jest.fn(),
  addBreak: jest.fn(),
  addQuote: jest.fn(),
  addSeparator: jest.fn(),
  clear: jest.fn(),
  stringify: jest.fn(),
  write: jest.fn()
}
