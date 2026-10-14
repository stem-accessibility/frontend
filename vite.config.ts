import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Most tests are plain logic and run in node. A component test opts in to a DOM with a
    // `// @vitest-environment jsdom` comment at the top of the file.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
