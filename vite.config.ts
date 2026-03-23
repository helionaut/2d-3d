import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveBasePath } from './src/config/basePath'

export default defineConfig({
  base: resolveBasePath(process.env),
  plugins: [react()],
})
