export default {
  files: ['__tests__/**/*.test.ts'],
  extensions: {
    ts: 'module'
  },
  nodeArguments: ['--import=tsimp/import', '--no-warnings']
}
