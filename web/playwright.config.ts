import 'dotenv/config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120000,
  expect: { timeout: 10000 },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5173',
    storageState: './tests/e2e/.auth-storage.json',
  },
  globalSetup: './tests/e2e/global-setup.ts',
  // Exclude authentication tests from using the storage state
  projects: [
    {
      name: 'e2e',
      testMatch: /^(?!.*auth).*\.spec\.ts$/,
    },
    {
      name: 'auth',
      testMatch: /auth.*\.spec\.ts$/,
      use: { storageState: undefined },
    },
  ],
});
