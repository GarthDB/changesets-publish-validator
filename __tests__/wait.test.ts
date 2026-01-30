/**
 * Unit tests for src/wait.ts
 */
import test from 'ava'
import { wait } from '../src/wait.js'

test('wait throws an invalid number', async (t) => {
  const input = parseInt('foo', 10)

  t.true(isNaN(input))

  await t.throwsAsync(async () => wait(input), {
    message: 'milliseconds is not a number'
  })
})

test('wait waits with a valid number', async (t) => {
  const start = new Date()
  await wait(500)
  const end = new Date()

  const delta = Math.abs(end.getTime() - start.getTime())

  t.true(delta > 450)
})
