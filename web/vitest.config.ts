import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts'
  }
})
