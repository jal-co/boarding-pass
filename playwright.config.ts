import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:5199', viewport: { width: 1280, height: 800 } },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5199 --strictPort', url: 'http://127.0.0.1:5199', reuseExistingServer: !process.env.CI },
})
