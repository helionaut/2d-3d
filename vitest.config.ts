import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts?(x)'],
    setupFiles: [resolve(import.meta.dirname, 'src/test/setup.ts')],
  },
})
